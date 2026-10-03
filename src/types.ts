export type Vec3=[number,number,number];

export type CareerNode={
  id:string;
  title:string;
  kind:"role"|"skill"|"mission";
  description:string;
  skills:string[];
  position:Vec3;
  prerequisites:string[];
  progress:number
};

export type SceneAction={
  type:"FOCUS_NODE"|"SHOW_SKILL"|"MOVE_NODE"|"ARRANGE_PATH"|"OPEN_MISSION"|"CREATE_MISSION"|"RESET_SCENE";
  nodeId?:string;
  targetNodeId?:string;
  skill?:string;
  position?:Vec3
};

export type Mission={
  id:string;
  title:string;
  skill:string;
  description:string;
  xp:number;
  completed:boolean
};
