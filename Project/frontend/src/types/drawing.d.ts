export type NodeId = number

export type Color = string

export type ObjectId = string

export type Point = {
    x: number
    y: number
}

export type Line = {
    points: Point[]
    color: Color
    strokeWidth: number
}

export type Frame = Line[]

export interface Node extends Point {
    nodeId: NodeId
}

export interface RCObject {
    id: ObjectId
    localColor: Color
    localStrokeWidth: number
    refNode: Node[]
    frames: Frame[]
}
