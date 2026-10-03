export default async function handler(req,res){
  if(req.method!=="POST"){
    res.status(405).json({error:"Method not allowed"});
    return;
  }

  const apiKey=process.env.OPENAI_API_KEY;
  if(!apiKey){
    res.status(503).json({error:"AI backend is not configured"});
    return;
  }

  try{
    const body=req.body||{};
    const command=typeof body.command==="string"?body.command.trim():"";
    const context=body.context&&typeof body.context==="object"?body.context:{};
    if(!command){
      res.status(400).json({error:"command is required"});
      return;
    }

    const schema={
      type:"object",
      additionalProperties:false,
      properties:{
        action:{type:"string",enum:["FOCUS_NODE","SHOW_SKILL","MOVE_NODE","ARRANGE_PATH","OPEN_MISSION","CREATE_MISSION","RESET_SCENE","NONE"]},
        skill:{type:["string","null"],enum:["Python","SQL","Excel","Pandas + NumPy",null]},
        targetSkill:{type:["string","null"],enum:["Python","SQL","Excel","Pandas + NumPy","Data Analyst",null]},
        message:{type:"string"},
        missionTitle:{type:["string","null"]},
        missionDescription:{type:["string","null"]},
        missionXp:{type:["integer","null"],minimum:25,maximum:500}
      },
      required:["action","skill","targetSkill","message","missionTitle","missionDescription","missionXp"]
    };

    const prompt=[
      "You are the SkillSpace spatial career agent.",
      "Map the user's natural-language request to exactly one safe scene action.",
      "Never invent node IDs or 3D coordinates. The client computes coordinates.",
      "Available nodes: Data Analyst role; Python, SQL, Excel, Pandas + NumPy skills.",
      "If the user asks for a mission, create a concrete beginner-to-intermediate data-analytics task.",
      "Keep message concise.",
      JSON.stringify({command,context})
    ].join("\n");

    const response=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer "+apiKey
      },
      body:JSON.stringify({
        model:process.env.OPENAI_MODEL||"gpt-6-luna",
        input:prompt,
        store:false,
        text:{format:{type:"json_schema",name:"skillspace_agent",strict:true,schema}}
      })
    });

    const data=await response.json();
    if(!response.ok){
      res.status(502).json({error:data?.error?.message||"OpenAI request failed"});
      return;
    }

    const textOutput=data?.output_text;
    if(typeof textOutput!=="string"){
      res.status(502).json({error:"AI returned no structured output"});
      return;
    }

    const result=JSON.parse(textOutput);
    res.status(200).json(result);
  }catch(error){
    console.error(error);
    res.status(500).json({error:"AI agent request failed"});
  }
}
