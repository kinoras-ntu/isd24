import { useEffect, useRef, useState } from 'react'
import type { FC, HTMLAttributes, MouseEventHandler } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import type { Line, Node, RCObject } from '@/types/drawing'
import type { State } from '@/types/state'

import { defaultNode } from '@/constants/defaults'

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
    const [timer, setTimer] = useState<number>(0)

    useEffect(() => setIsDrawing(false), [tool, stage])
    useEffect(() => drawObject(), [currentObject, nodes, timer])
    useEffect(() => {
        const fetchNodeRoutine = setInterval(() => fetchNodes(), 100)
        const timingRoutine = setInterval(() => setTimer((timer) => timer + 1), 250)
        return () => {
            clearInterval(fetchNodeRoutine)
            clearInterval(timingRoutine)
        }
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

    const getNearestNode = (x: number, y: number): Node => {
        let retNode: Node = defaultNode
        let minDistance: number = Infinity
        nodes.forEach((node) => {
            const distance: number = Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2))
            if (distance < minDistance) {
                minDistance = distance
                retNode = structuredClone(node)
            }
        })
        return retNode
    }

    const handleMouseDown: MouseEventHandler<HTMLCanvasElement> = (e) => {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            switch (`${tool}, ${stage}`) {
                case 'Binding, Select':
                case 'Flipbook, Select':
                    setCurrentObject({
                        ...currentObject,
                        refNode: [getNearestNode(x, y)]
                    })
                    break
                case 'Triggering, Select':
                    setCurrentObject({
                        ...currentObject,
                        refNode: [...currentObject.refNode, getNearestNode(x, y)].slice(-2)
                    })
                    break
                case 'Binding, Draw':
                case 'Flipbook, Draw':
                    const frames = currentObject.frames
                    frames[frames.length - 1].push({
                        points: [{ x, y }],
                        strokeWidth: currentStrokeWidth,
                        color: currentColor
                    })
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
                case 'Flipbook, Draw':
                    const frames = currentObject.frames
                    frames[frames.length - 1][frames[frames.length - 1].length - 1].points.push({ x, y })
                    setCurrentObject({ ...currentObject, frames })
                    break
                default:
            }
        }
    }

    const drawLine = (ctx: CanvasRenderingContext2D, line: Line, node: Node, refNode: Node) => {
        const foOpacity = stage !== 'Draw' ? 'ff' : '7f'
        const offsetX = node.x - refNode.x
        const offsetY = node.y - refNode.y
        ctx.lineWidth = line.strokeWidth
        ctx.beginPath()
        ctx.moveTo(line.points[0].x + offsetX, line.points[0].y + offsetY)
        for (let i = 1; i < line.points.length; i++) {
            ctx.lineTo(line.points[i].x + offsetX, line.points[i].y + offsetY)
        }
        ctx.strokeStyle = `${line.color}${foOpacity}`
        ctx.stroke()
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

        finishedObjects.Binding.forEach(({ refNode, frames }) => {
            const node = nodes.find(({ nodeId }) => nodeId === refNode[0].nodeId)
            if (node) frames[0].forEach((line) => drawLine(ctx, line, node, refNode[0]))
        })

        finishedObjects.Flipbook.forEach(({ refNode, frames }) => {
            const node = nodes.find(({ nodeId }) => nodeId === refNode[0].nodeId)
            if (node) frames[timer % frames.length].forEach((line) => drawLine(ctx, line, node, refNode[0]))
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
