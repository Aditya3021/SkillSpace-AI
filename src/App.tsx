import {useEffect,useRef,useState}from"react";
import{careerNodes,missions}from"./data/career";
import{parseAgentCommand,agentSuggestions}from"./ai/SceneAction";
import{SkillSpaceWorld}from"./scene/SkillSpaceWorld";
import type{CareerNode,Mission}from"./types";

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
  const[xp,setXp]=useState(0);
  const[mission,setMission]=useState<Mission|null>(null);
  const[agentStatus,setAgentStatus]=useState("Ready for a scene command.");
  const[xrState,setXrState]=useState<"loading"|"browser"|"xr"|"error">("loading");
  const[listening,setListening]=useState(false);
  const recognitionRef=useRef<any>(null);

  useEffect(()=>{
    if(!host.current)return;
    let disposed=false;
    const w=new SkillSpaceWorld();
    world.current=w;
    w.init(host.current,careerNodes,(nodeId)=>{
      const node=careerNodes.find(item=>item.id===nodeId);
      if(node){setSelected(node);w.focus(nodeId);}
    },()=>startVoice()).then(()=>{if(!disposed){setXrState("browser");w.setCopilot("DATA ANALYST",agentStatus,false);}}).catch((error)=>{
      console.error(error);
      if(!disposed)setXrState("error");
    });
    return()=>{disposed=true;w.dispose();world.current=null;};
  },[]);

  const startVoice=()=>{
    const SpeechRecognition=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!SpeechRecognition){
      setAgentStatus("Voice commands are not supported in this browser.");
      return;
    }
    if(listening){
      recognitionRef.current?.stop?.();
      return;
    }
    const recognition=new SpeechRecognition();
    recognition.lang="en-IN";
    recognition.interimResults=false;
    recognition.continuous=false;
    recognition.onstart=()=>{setListening(true);setAgentStatus("Listening for a scene command…");};
    recognition.onresult=(event:any)=>{
      const transcript=event.results?.[0]?.[0]?.transcript?.trim()||"";
      if(transcript)run(transcript);
    };
    recognition.onerror=()=>{setListening(false);setAgentStatus("Voice input stopped. Try again.");};
    recognition.onend=()=>setListening(false);
    recognitionRef.current=recognition;
    try{recognition.start();}catch{setListening(false);}
  };

  const select=(node:CareerNode)=>{
    setSelected(node);
    world.current?.focus(node.id);
    setAgentStatus("Focused "+node.title+".");
  };

  const enterXR=async()=>{
    setXrState("loading");
    const entered=await world.current?.enterXR();
    setXrState(entered?"xr":"browser");
  };

  const createMission=(skill:string)=>{
    const template=missionTemplates[skill]??missionTemplates.Python;
    setMission({id:"agent-"+skill.toLowerCase().replace(/[^a-z0-9]+/g,"-"),...template,completed:false});
    setAgentStatus("Created a mission for "+skill+".");
  };

  const run=(text:string)=>{
    const action=parseAgentCommand(text);
    if(!action){setAgentStatus("I couldn't map that request to a scene action.");return;}

    if(action.type==="FOCUS_NODE"||action.type==="SHOW_SKILL"){
      const node=careerNodes.find(item=>item.id===action.nodeId);
      if(node){setSelected(node);world.current?.focus(node.id);setAgentStatus(action.type==="SHOW_SKILL"?"Showing skills for "+node.title+".":"Focused "+node.title+".");}
    }
    if(action.type==="OPEN_MISSION"&&action.skill){
      const m=missions.find(item=>item.skill.toLowerCase()===action.skill!.toLowerCase())||missions[0];
      setMission(m);
      setAgentStatus("Opened the "+m.skill+" mission.");
    }
    if(action.type==="CREATE_MISSION"&&action.skill)createMission(action.skill);
    if(action.type==="MOVE_NODE"&&action.nodeId){
      world.current?.apply(action);
      const node=careerNodes.find(item=>item.id===action.nodeId);
      setAgentStatus(node?"Moved "+node.title+" closer to "+(action.targetNodeId?"the requested node":"the target")+".":"Moved the node.");
    }
    if(action.type==="ARRANGE_PATH"){world.current?.apply(action);setAgentStatus("Arranged the career path into a clean spatial layout.");}
    if(action.type==="RESET_SCENE"){world.current?.apply(action);setAgentStatus("Workspace reset to the original layout.");}
    if(!["MOVE_NODE","ARRANGE_PATH","RESET_SCENE"].includes(action.type))world.current?.apply(action);
    setCommand("");
  };

  const complete=()=>{
    if(!mission)return;
    setXp(value=>value+mission.xp);
    setMission({...mission,completed:true});
    setAgentStatus("Mission completed. +"+mission.xp+" XP.");
  };

  useEffect(()=>{
    world.current?.setCopilot(selected.title,agentStatus,listening);
  },[selected,agentStatus,listening]);

  useEffect(()=>()=>recognitionRef.current?.stop?.(),[]);

  const xrLabel=xrState==="xr"?"EXIT XR":xrState==="loading"?"CONNECTING…":"ENTER XR / SIMULATOR";

  return <main>
    <div ref={host} className="xr-canvas"/>
    <header>
      <div><b>SKILLSPACE</b><span>AI CAREER WORKSPACE</span></div>
      <div className="header-actions">
        <span className={"xr-status "+xrState}>{xrState==="xr"?"XR ACTIVE":xrState==="error"?"XR UNAVAILABLE":"BROWSER READY"}</span>
        <button onClick={async()=>{if(xrState==="xr"){await world.current?.exitXR();setXrState("browser");}else await enterXR();}} disabled={xrState==="loading"||xrState==="error"}>{xrLabel}</button>
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
      <div className={"agent-status "+(listening?"listening":"")}><span>●</span>{agentStatus}</div>
      <div className="suggestions">{agentSuggestions.map(s=><button key={s}onClick={()=>run(s)}>{s}</button>)}</div>
      <form onSubmit={event=>{event.preventDefault();run(command)}}><input value={command}onChange={event=>setCommand(event.target.value)}placeholder="Tell the workspace what to do…"/><button type="button" className={listening?"mic active": "mic"} onClick={startVoice} aria-label={listening?"Stop voice command":"Start voice command"}>{listening?"■":"MIC"}</button><button>Run</button></form>
      <div className="mission"><div><span>XP</span><strong>{xp}</strong></div><button onClick={()=>setMission(missions.find(item=>item.skill===selected.title)||missions[0])}>Start mission</button></div>
    </aside>

    {mission&&<div className="modal"><div className="modal-card"><div className="eyebrow">MISSION</div><h2>{mission.title}</h2><p>{mission.description}</p><strong>+{mission.xp} XP</strong><div><button onClick={complete}disabled={mission.completed}>{mission.completed?"Completed":"Mark complete"}</button><button onClick={()=>setMission(null)}>Close</button></div></div></div>}
    <footer>Hands-first • WebXR • AI scene agent • Desktop emulator fallback</footer>
  </main>
}
