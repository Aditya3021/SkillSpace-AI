import type {CareerNode,SceneAction} from "../types";

export type RemoteAgentResult={
  action:SceneAction["type"]|"NONE";
  skill:string|null;
  targetSkill:string|null;
  message:string;
  missionTitle:string|null;
  missionDescription:string|null;
  missionXp:number|null;
};

function nodeIdForSkill(skill:string|null){
  if(!skill)return null;
  const value=skill.toLowerCase();
  if(value==="python")return"skill-python";
  if(value==="sql")return"skill-sql";
  if(value==="excel")return"skill-excel";
  if(value.includes("pandas"))return"skill-pandas";
  if(value==="data analyst")return"role-data-analyst";
  return null;
}

export async function askRemoteAgent(command:string,selected:CareerNode):Promise<RemoteAgentResult|null>{
  try{
    const response=await fetch("/api/agent",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        command,
        context:{
          selectedNode:selected.id,
          selectedTitle:selected.title,
          selectedSkills:selected.skills,
        },
      }),
    });
    if(!response.ok)return null;
    const result=await response.json() as RemoteAgentResult;
    if(!result||typeof result.action!=="string")return null;
    return result;
  }catch{
    return null;
  }
}

export function remoteToSceneAction(result:RemoteAgentResult):SceneAction|null{
  const nodeId=nodeIdForSkill(result.skill);
  const targetNodeId=nodeIdForSkill(result.targetSkill);
  switch(result.action){
    case"FOCUS_NODE":
      return nodeId?{type:"FOCUS_NODE",nodeId}:null;
    case"SHOW_SKILL":
      return nodeId?{type:"SHOW_SKILL",nodeId}:null;
    case"OPEN_MISSION":
      return result.skill?{type:"OPEN_MISSION",skill:result.skill}:null;
    case"CREATE_MISSION":
      return result.skill?{type:"CREATE_MISSION",skill:result.skill}:null;
    case"ARRANGE_PATH":
      return{type:"ARRANGE_PATH"};
    case"RESET_SCENE":
      return{type:"RESET_SCENE"};
    case"MOVE_NODE":
      return nodeId&&targetNodeId&&nodeId!==targetNodeId?{type:"MOVE_NODE",nodeId,targetNodeId}:null;
    default:
      return null;
  }
}
