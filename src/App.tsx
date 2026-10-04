import {useEffect,useRef,useState}from"react";
import{careerNodes,missions}from"./data/career";
import{parseAgentCommand,agentSuggestions}from"./ai/SceneAction";
import{askRemoteAgent,remoteToSceneAction}from"./ai/RemoteAgent";
import{SkillSpaceWorld}from"./scene/SkillSpaceWorld";
import type{CareerNode,Mission,SceneAction}from"./types";

const PROGRESS_KEY="skillspace-progress-v1";

type SavedProgress={xp:number;completedMissionIds:string[]};

function readProgress():SavedProgress{
  try{
    const raw=localStorage.getItem(PROGRESS_KEY);
    if(!raw)return{xp:0,completedMissionIds:[]};
    const value=JSON.parse(raw);
    return{xp:typeof value?.xp==="number"?value.xp:0,completedMissionIds:Array.isArray(value?.completedMissionIds)?value.completedMissionIds.filter((id:any)=>typeof id==="string"):[]};
  }catch{return{xp:0,completedMissionIds:[]};}
}

const missionTemplates:Record<string,Omit<Mission,"id"|"completed">>={
  Python:{title:"Analyze a CSV",skill:"Python",description:"Load a dataset, clean missing values and produce three useful findings.",xp:100},
  SQL:{title:"Write 5 SQL queries",skill:"SQL",description:"Use joins, grouping and a window function on a sample dataset.",xp:100},
  "Pandas + NumPy":{title:"Build a mini pipeline",skill:"Pandas + NumPy",description:"Transform raw rows into a clean analysis table.",xp:150},
  Excel:{title:"Build an executive report",skill:"Excel",description:"Create a pivot-driven report with three decision-ready insights.",xp:100},
};

export default function App(){
  const host=useRef<HTMLDivElement>(null);
  const world=useRef<SkillSpaceWorld|null>(null);
  const[selected,setSelected]=useState<CareerNode>(careerNodes[0]);
  const[command,setCommand]=useState("");
  const initialProgress=readProgress();
  const[xp,setXp]=useState(initialProgress.xp);
  const[completedMissionIds,setCompletedMissionIds]=useState<string[]>(initialProgress.completedMissionIds);
  const[mission,setMission]=useState<Mission|null>(null);
  const[agentStatus,setAgentStatus]=useState("Ready for a scene command.");
  const[xrState,setXrState]=useState<"loading"|"browser"|"xr"|"error">("loading");
  const[listening,setListening]=useState(false);
  const[thinking,setThinking]=useState(false);
  const[demo,setDemo]=useState(false);
  const recognitionRef=useRef<any>(null);
  const listeningRef=useRef(false);

  const select=(node:CareerNode)=>{
    setSelected(node);
    world.current?.focus(node.id);
    setAgentStatus("Focused "+node.title+".");
  };

  const createMission=(skill:string,custom?:{title?:string|null;description?:string|null;xp?:number|null})=>{
    const template=missionTemplates[skill]??missionTemplates.Python;
    setMission({
      id:"agent-"+skill.toLowerCase().replace(/[^a-z0-9]+/g,"-")+"-mission",
      title:custom?.title||template.title,
      skill,
      description:custom?.description||template.description,
      xp:custom?.xp||template.xp,
      completed:false
    });
    setAgentStatus("Created a mission for "+skill+".");
  };

  const applyAction=(action:SceneAction,message?:string)=>{
    if(action.type==="FOCUS_NODE"||action.type==="SHOW_SKILL"){
      const node=careerNodes.find(item=>item.id===action.nodeId);
      if(node){setSelected(node);world.current?.focus(node.id);setAgentStatus(message||(action.type==="SHOW_SKILL"?"Showing skills for "+node.title+".":"Focused "+node.title+"."));}
    }
    if(action.type==="OPEN_MISSION"&&action.skill){
      const m=missions.find(item=>item.skill.toLowerCase()===action.skill!.toLowerCase())||missions[0];
      setMission({...m,completed:completedMissionIds.includes(m.id)});
      setAgentStatus(message||("Opened the "+m.skill+" mission."));
    }
    if(action.type==="CREATE_MISSION"&&action.skill)createMission(action.skill);
    if(action.type==="MOVE_NODE"&&action.nodeId){
      world.current?.apply(action);
      const node=careerNodes.find(item=>item.id===action.nodeId);
      setAgentStatus(message||(node?"Moved "+node.title+" to the requested position.":"Moved the node."));
    }
    if(action.type==="ARRANGE_PATH"){world.current?.apply(action);setAgentStatus(message||"Arranged the career path into a clean spatial layout.");}
    if(action.type==="RESET_SCENE"){world.current?.apply(action);setAgentStatus(message||"Workspace reset to the original layout.");}
    if(!["MOVE_NODE","ARRANGE_PATH","RESET_SCENE"].includes(action.type))world.current?.apply(action);
  };

  const run=async(text:string)=>{
    const local=parseAgentCommand(text);
    if(local){
      applyAction(local);
      setCommand("");
      return;
    }

    setThinking(true);
    setAgentStatus("AI agent is interpreting the request…");
    const remote=await askRemoteAgent(text,selected);
    setThinking(false);
    if(!remote){
      setAgentStatus("I couldn't map that request. Try a career, skill, mission, move, arrange, or reset command.");
      return;
    }

    const action=remoteToSceneAction(remote);
    if(remote.action==="CREATE_MISSION"&&remote.skill){
      createMission(remote.skill,{
        title:remote.missionTitle,
        description:remote.missionDescription,
        xp:remote.missionXp
      });
      setAgentStatus(remote.message);
    }else if(action){
      applyAction(action,remote.message);
    }else{
      setAgentStatus(remote.message||"The AI agent returned no executable scene action.");
    }
    setCommand("");
  };

  const startVoice=()=>{
    const SpeechRecognition=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!SpeechRecognition){
      setAgentStatus("Voice commands are not supported in this browser.");
      return;
    }
    if(listeningRef.current){
      recognitionRef.current?.stop?.();
      return;
    }
    const recognition=new SpeechRecognition();
    recognition.lang="en-IN";
    recognition.interimResults=false;
    recognition.continuous=false;
    recognition.onstart=()=>{listeningRef.current=true;setListening(true);setAgentStatus("Listening for a scene command…");};
    recognition.onresult=(event:any)=>{
      const transcript=event.results?.[0]?.[0]?.transcript?.trim()||"";
      if(transcript)void run(transcript);
    };
    recognition.onerror=()=>{listeningRef.current=false;setListening(false);setAgentStatus("Voice input stopped. Try again.");};
    recognition.onend=()=>{listeningRef.current=false;setListening(false);};
    recognitionRef.current=recognition;
    try{recognition.start();}catch{listeningRef.current=false;setListening(false);}
  };

  useEffect(()=>{
    if(!host.current)return;
    let disposed=false;
    const w=new SkillSpaceWorld();
    world.current=w;
    w.init(host.current,careerNodes,(nodeId)=>{
      const node=careerNodes.find(item=>item.id===nodeId);
      if(node){setSelected(node);w.focus(nodeId);}
    },()=>startVoice()).then(()=>{if(!disposed)setXrState("browser");}).catch((error)=>{
      console.error(error);
      if(!disposed)setXrState("error");
    });
    return()=>{disposed=true;w.dispose();world.current=null;};
  },[]);

  useEffect(()=>{world.current?.setCopilot(selected.title,agentStatus,listening||thinking);},[selected,agentStatus,listening,thinking]);

  useEffect(()=>{
    try{localStorage.setItem(PROGRESS_KEY,JSON.stringify({xp,completedMissionIds}));}catch{}
  },[xp,completedMissionIds]);
  useEffect(()=>()=>recognitionRef.current?.stop?.(),[]);

  const enterXR=async()=>{
    setXrState("loading");
    const entered=await world.current?.enterXR();
    setXrState(entered?"xr":"browser");
  };

  const startDemo=async()=>{
    if(demo)return;
    setDemo(true);
    const steps=[
      {delay:0,text:"Demo: focusing Data Analyst.",action:{type:"FOCUS_NODE",nodeId:"role-data-analyst"} as SceneAction},
      {delay:900,text:"Demo: arranging the career graph.",action:{type:"ARRANGE_PATH"} as SceneAction},
      {delay:1800,text:"Demo: creating the SQL mission.",action:{type:"CREATE_MISSION",skill:"SQL"} as SceneAction},
    ];
    for(const step of steps){
      await new Promise(resolve=>window.setTimeout(resolve,step.delay));
      applyAction(step.action,step.text);
    }
    setAgentStatus("Demo flow complete. Try a voice command next.");
    setDemo(false);
  };

  const complete=()=>{
    if(!mission||mission.completed)return;
    setXp(value=>value+mission.xp);
    setCompletedMissionIds(ids=>ids.includes(mission.id)?ids:[...ids,mission.id]);
    setMission({...mission,completed:true});
    setAgentStatus("Mission completed. +"+mission.xp+" XP.");
  };

  const xrLabel=xrState==="xr"?"EXIT XR":xrState==="loading"?"CONNECTING…":"ENTER XR / SIMULATOR";

  return <main>
    <div ref={host} className="xr-canvas"/>
    <header>
      <div><b>SKILLSPACE</b><span>AI CAREER WORKSPACE</span></div>
      <div className="header-actions">
        <span className={"xr-status "+xrState}>{xrState==="xr"?"XR ACTIVE":xrState==="error"?"XR UNAVAILABLE":"BROWSER READY"}</span>
        <button onClick={async()=>{if(xrState==="xr"){await world.current?.exitXR();setXrState("browser");}else await enterXR();}} disabled={xrState==="loading"||xrState==="error"}>{xrLabel}</button>
        <button className="demo-button" onClick={()=>void startDemo()} disabled={demo}>{demo?"DEMO RUNNING":"RUN DEMO"}</button>
      </div>
    </header>

    <aside className="panel left">
      <div className="eyebrow">CAREER MAP</div>
      <h1>Become a Data Analyst</h1>
      <p>Build your path spatially. Select a node with mouse, ray, or hand pinch, then grab it to reorganize your workspace.</p>
      {careerNodes.map(node=><button className={selected.id===node.id?"node active":"node"}key={node.id}onClick={()=>select(node)}><span>{node.title}</span><small>{node.progress}%</small></button>)}
    </aside>

    <aside className="panel right">
      <div className="eyebrow">AI COPILOT</div>
      <h2>{selected.title}</h2>
      <p>{selected.description}</p>
      <div className="progress"><i style={{width:selected.progress+"%"}}/></div>
      <small>{selected.progress}% pathway progress</small>
      <div className="skill-tags">{selected.skills.map(skill=><span key={skill}>{skill}</span>)}</div>
      <div className={"agent-status "+(listening||thinking?"listening":"")}><span>●</span>{thinking?"AI AGENT THINKING…":agentStatus}</div>
      <div className="suggestions">{agentSuggestions.map(s=><button key={s}onClick={()=>void run(s)}>{s}</button>)}</div>
      <form onSubmit={event=>{event.preventDefault();void run(command)}}><input value={command}onChange={event=>setCommand(event.target.value)}placeholder="Tell the workspace what to do…"/><button type="button" className={listening?"mic active":"mic"} onClick={startVoice} aria-label={listening?"Stop voice command":"Start voice command"}>{listening?"■":"MIC"}</button><button disabled={thinking||!command.trim()}>Run</button></form>
      <div className="mission"><div><span>XP</span><strong>{xp}</strong></div><button onClick={()=>(()=>{const m=missions.find(item=>item.skill===selected.title)||missions[0];setMission({...m,completed:completedMissionIds.includes(m.id)});})()}>Start mission</button></div>
    </aside>

    {mission&&<div className="modal"><div className="modal-card"><div className="eyebrow">MISSION</div><h2>{mission.title}</h2><p>{mission.description}</p><strong>+{mission.xp} XP</strong><div><button onClick={complete}disabled={mission.completed}>{mission.completed?"Completed":"Mark complete"}</button><button onClick={()=>setMission(null)}>Close</button></div></div></div>}
    <footer>Hands-first • WebXR • AI scene agent • Quest-ready • Desktop fallback</footer>
  </main>
}
