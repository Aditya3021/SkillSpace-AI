import {careerNodes} from "../data/career";
import type {SceneAction,Vec3} from "../types";

const aliases=[
  ["python","skill-python"],
  ["sql","skill-sql"],
  ["excel","skill-excel"],
  ["pandas","skill-pandas"],
  ["numpy","skill-pandas"],
  ["data analyst","role-data-analyst"],
] as const;

function nodeIdFor(text:string){
  const match=aliases.find(([name])=>text.includes(name));
  return match?.[1]??null;
}

function nodeById(id:string){
  return careerNodes.find(node=>node.id===id);
}

function midpoint(a:Vec3,b:Vec3):Vec3{
  return [(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
}

export function parseAgentCommand(input:string):SceneAction|null{
  const q=input.trim().toLowerCase();
  if(!q)return null;

  if(q.includes("reset")||q.includes("start over")||q.includes("restore")){
    return{type:"RESET_SCENE"};
  }

  if(q.includes("arrange")||q.includes("organize")||q.includes("layout")||q.includes("career path")){
    return{type:"ARRANGE_PATH"};
  }

  const source=nodeIdFor(q);
  if((q.includes("create")||q.includes("generate")||q.includes("build"))&&q.includes("mission")){
    return{type:"CREATE_MISSION",skill:q.includes("sql")?"SQL":q.includes("pandas")||q.includes("numpy")?"Pandas + NumPy":q.includes("excel")?"Excel":"Python"};
  }

  if(q.includes("mission")||q.includes("challenge")||q.includes("task")){
    return{type:"OPEN_MISSION",skill:q.includes("sql")?"SQL":q.includes("pandas")||q.includes("numpy")?"Pandas + NumPy":q.includes("excel")?"Excel":"Python"};
  }

  const targetMatch=q.match(/(?:closer to|near|next to|beside|by)\s+(python|sql|excel|pandas|numpy|data analyst)/);
  if((q.includes("move")||q.includes("place")||q.includes("put"))&&source&&targetMatch){
    const targetId=nodeIdFor(targetMatch[1]);
    const sourceNode=nodeById(source);
    const targetNode=targetId?nodeById(targetId):null;
    if(sourceNode&&targetNode&&source!==targetId){
      return{type:"MOVE_NODE",nodeId:source,targetNodeId:targetId,position:midpoint(sourceNode.position,targetNode.position)};
    }
  }

  if(q.includes("show")&&(q.includes("skill")||q.includes("skills"))){
    const role=nodeIdFor(q);
    if(role)return{type:"SHOW_SKILL",nodeId:role};
  }

  if(source){
    return{type:"FOCUS_NODE",nodeId:source};
  }

  return q.includes("career")?{type:"FOCUS_NODE",nodeId:"role-data-analyst"}:null;
}

export const agentSuggestions=[
  "Show me the skills for Data Analyst",
  "Move Python closer to SQL",
  "Create a mission for SQL",
  "Arrange my career path",
  "Reset the workspace",
];
