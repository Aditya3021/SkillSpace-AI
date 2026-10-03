import {useEffect,useRef,useState}from"react";
import{careerNodes,missions}from"./data/career";
import{parseAgentCommand,agentSuggestions}from"./ai/SceneAction";
import{SkillSpaceWorld}from"./scene/SkillSpaceWorld";
import type{CareerNode,Mission}from"./types";

export default function App(){
  const host=useRef<HTMLDivElement>(null);
  const world=useRef<SkillSpaceWorld|null>(null);
  const[selected,setSelected]=useState<CareerNode>(careerNodes[0]);
  const[command,setCommand]=useState("");
  const[xp,setXp]=useState(0);
  const[mission,setMission]=useState<Mission|null>(null);
  const[xrState,setXrState]=useState<"loading"|"browser"|"xr"|"error">("loading");

  useEffect(()=>{
    if(!host.current)return;
    let disposed=false;
    const w=new SkillSpaceWorld();
    world.current=w;

    w.init(host.current,careerNodes,(nodeId)=>{
      const node=careerNodes.find(item=>item.id===nodeId);
      if(node){
        setSelected(node);
        w.focus(nodeId);
      }
    }).then(()=>{
      if(!disposed)setXrState("browser");
    }).catch((error)=>{
      console.error(error);
      if(!disposed)setXrState("error");
    });

    return()=>{
      disposed=true;
      w.dispose();
      world.current=null;
    };
  },[]);

  const select=(node:CareerNode)=>{
    setSelected(node);
    world.current?.focus(node.id);
  };

  const enterXR=async()=>{
    setXrState("loading");
    const entered=await world.current?.enterXR();
    setXrState(entered?"xr":"browser");
  };

  const run=(text:string)=>{
    const action=parseAgentCommand(text);
    if(!action)return;

    if(action.type==="FOCUS_NODE"&&action.nodeId){
      const node=careerNodes.find(item=>item.id===action.nodeId);
      if(node)select(node);
    }

    if(action.type==="OPEN_MISSION"){
      const m=missions.find(item=>item.skill.toLowerCase()===action.skill?.toLowerCase())||missions[0];
      setMission(m);
    }

    world.current?.apply(action);
    setCommand("");
  };

  const complete=()=>{
    if(!mission)return;
    setXp(value=>value+mission.xp);
    setMission({...mission,completed:true});
  };

  const xrLabel=xrState==="xr"?"EXIT XR":xrState==="loading"?"CONNECTING…":"ENTER XR / SIMULATOR";

  return <main>
    <div ref={host} className="xr-canvas"/>

    <header>
      <div>
        <b>SKILLSPACE</b>
        <span>AI CAREER WORKSPACE</span>
      </div>
      <div className="header-actions">
        <span className={"xr-status "+xrState}>
          {xrState==="xr"?"XR ACTIVE":xrState==="error"?"XR UNAVAILABLE":"BROWSER READY"}
        </span>
        <button
          onClick={async()=>xrState==="xr"?await world.current?.exitXR():await enterXR()}
          disabled={xrState==="loading"||xrState==="error"}
        >
          {xrLabel}
        </button>
      </div>
    </header>

    <aside className="panel left">
      <div className="eyebrow">CAREER MAP</div>
      <h1>Become a Data Analyst</h1>
      <p>Build your path spatially. Select a node with mouse, ray, or hand pinch, then grab it to reorganize your workspace.</p>
      {careerNodes.map(node=>
        <button className={selected.id===node.id?"node active":"node"}key={node.id}onClick={()=>select(node)}>
          <span>{node.title}</span>
          <small>{node.progress}%</small>
        </button>
      )}
    </aside>

    <aside className="panel right">
      <div className="eyebrow">AI COPILOT</div>
      <h2>{selected.title}</h2>
      <p>{selected.description}</p>
      <div className="progress"><i style={{width:selected.progress+"%"}}/></div>
      <small>{selected.progress}% pathway progress</small>

      <div className="suggestions">
        {agentSuggestions.map(s=><button key={s}onClick={()=>run(s)}>{s}</button>)}
      </div>

      <form onSubmit={event=>{event.preventDefault();run(command)}}>
        <input value={command}onChange={event=>setCommand(event.target.value)}placeholder="Tell the workspace what to do…"/>
        <button>Run</button>
      </form>

      <div className="mission">
        <div><span>XP</span><strong>{xp}</strong></div>
        <button onClick={()=>setMission(missions.find(item=>item.skill===selected.title)||missions[0])}>Start mission</button>
      </div>
    </aside>

    {mission&&<div className="modal">
      <div className="modal-card">
        <div className="eyebrow">MISSION</div>
        <h2>{mission.title}</h2>
        <p>{mission.description}</p>
        <strong>+{mission.xp} XP</strong>
        <div>
          <button onClick={complete}disabled={mission.completed}>{mission.completed?"Completed":"Mark complete"}</button>
          <button onClick={()=>setMission(null)}>Close</button>
        </div>
      </div>
    </div>}

    <footer>Hands-first • WebXR • AI scene actions • Desktop emulator fallback</footer>
  </main>
}
