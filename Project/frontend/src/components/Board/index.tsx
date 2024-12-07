import { useEffect, useRef, useState } from 'react'
import type { FC, HTMLAttributes, MouseEventHandler } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import type { Node, NodeId, RCObject } from '@/types/drawing'
import type { State } from '@/types/state'

interface BoardProps extends HTMLAttributes<HTMLCanvasElement> {
    height: number
    width: number
}

const Board: FC<BoardProps> = ({ height, width, ...restProps }) => {
    const tool = useSelector((state: State) => state.tool)
    const currentColor = useSelector((state: State) => state.color)
    const currentStrokeWidth = useSelector((state: State) => state.strokeWidth)
    const stage = useSelector((state: State) => state.stage)
    const currentObject = useSelector((state: State) => state.currentObject)
    const finishedObjects = useSelector((state: State) => state.finishedObjects)

    const dispatch = useDispatch()
    const setCurrentObject = (payload: RCObject) => dispatch({ type: 'SET_CURRENT_OBJECT', payload })

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState<Boolean>(false)
    const [nodes, setNodes] = useState<Node[]>([])

    useEffect(() => setIsDrawing(false), [tool, stage])
    useEffect(() => drawObject(), [currentObject, nodes])
    useEffect(() => {
        const fetchNodeRoutine = setInterval(() => fetchNodes(), 100)
        return () => clearInterval(fetchNodeRoutine)
    }, [])

    const fetchNodes = async () => {
        try {
            const response = await fetch(`/nodes`)
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
            setNodes((await response.json()).nodes)
        } catch (err) {
            console.error('Error fetching node positions:', err)
        }
    }

    const getNearestNode = (x: number, y: number): NodeId => {
        let index: NodeId = -1
        let minDistance: number = Infinity
        nodes.forEach((node) => {
            const distance: number = Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2))
            if (distance < minDistance) {
                minDistance = distance
                index = node.nodeId
            }
        })
        return index
    }

    const handleMouseDown: MouseEventHandler<HTMLCanvasElement> = (e) => {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            switch (`${tool}, ${stage}`) {
                case 'Binding, Select':
                    const nodeId = getNearestNode(x, y)
                    const node = nodes.find((node) => node.nodeId == nodeId)
                    setCurrentObject({
                        ...currentObject,
                        nodeId: [nodeId],
                        refPoint: { x: node?.x ?? 0, y: node?.y ?? 0 }
                    })
                    break
                case 'Binding, Draw':
                    const frames = currentObject.frames
                    if (frames.length === 0) frames.push([])
                    frames[0].push({ points: [{ x, y }], strokeWidth: currentStrokeWidth, color: currentColor })
                    setIsDrawing(true)
                    setCurrentObject({ ...currentObject, frames })
                    break
                default:
            }
        }
    }

    const handleMouseMove: MouseEventHandler<HTMLCanvasElement> = (e) => {
        if (!isDrawing) return
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            switch (`${tool}, ${stage}`) {
                case 'Binding, Draw':
                    const frames = currentObject.frames
                    frames[0][frames[0].length - 1].points.push({ x, y })
                    setCurrentObject({ ...currentObject, frames })
                    break
                default:
            }
        }
    }

    const drawObject = () => {
        const ctx = canvasRef.current?.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvasRef.current?.width ?? 0, canvasRef.current?.height ?? 0)

        // Draw current object
        currentObject.frames?.forEach((frame, index) => {
            const opacity = index === currentObject.frames.length - 1 ? 'ff' : '7f'
            frame.forEach((line) => {
                if (!line.points[0]) return
                ctx.lineWidth = line.strokeWidth
                ctx.beginPath()
                ctx.moveTo(line.points[0].x, line.points[0].y)
                for (let i = 1; i < line.points.length; i++) {
                    ctx.lineTo(line.points[i].x, line.points[i].y)
                }
                ctx.strokeStyle = `${line.color}${opacity}`
                ctx.stroke()
            })
        })

        // Draw finished objects
        finishedObjects.Binding.forEach((bindingObject) => {
            const node = nodes.find(({ nodeId }) => nodeId === bindingObject.nodeId[0])
            const opacity = stage !== 'Draw' ? 'ff' : '7f'
            if (node) {
                bindingObject.frames[0].forEach((line) => {
                    const offsetX = node.x - bindingObject.refPoint.x
                    const offsetY = node.y - bindingObject.refPoint.y
                    ctx.lineWidth = line.strokeWidth
                    ctx.beginPath()
                    ctx.moveTo(line.points[0].x + offsetX, line.points[0].y + offsetY)
                    for (let i = 1; i < line.points.length; i++) {
                        ctx.lineTo(line.points[i].x + offsetX, line.points[i].y + offsetY)
                    }
                    ctx.strokeStyle = `${line.color}${opacity}`
                    ctx.stroke()
                })
            }
        })
    }

    return (
        <canvas
            height={height}
            width={width}
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsDrawing(false)}
            onMouseLeave={() => setIsDrawing(false)}
            {...restProps}
        />
    )
}

export default Board
