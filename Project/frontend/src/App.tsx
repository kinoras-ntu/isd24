import { MouseEventHandler, useEffect, useRef, useState } from 'react'

const SERVER = ''

type NodeId = number

interface Point {
    x: number
    y: number
}

type Line = Point[]

interface Node extends Point {
    nodeId: NodeId
}

interface Drawing {
    nodeId: NodeId
    lines: Line[]
    ref: Point
}

const defaultDrawing: Drawing = { nodeId: -1, lines: [], ref: { x: 0, y: 0 } }

const App = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const [mode, setMode] = useState<string>('idle')
    const [nodes, setNodes] = useState<Node[]>([])
    const [isDrawing, setIsDrawing] = useState<boolean>(false)

    const [drawings, setDrawings] = useState<Drawing[]>([])
    const [currDrawing, setCurrDrawing] = useState<Drawing>(defaultDrawing)

    const getNodes = async () => {
        try {
            const response = await fetch(`${SERVER}/nodes`)
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
            const data = await response.json()
            setNodes(data.nodes)
        } catch (err) {
            console.error('Error fetching node positions:', err)
        }
    }

    useEffect(() => {
        const interval = setInterval(() => getNodes(), 33)
        return () => clearInterval(interval)
    }, [])

    const handleSave = () => {
        if (currDrawing.lines.length > 0) {
            setDrawings([...drawings, currDrawing])
            setCurrDrawing(defaultDrawing)
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

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d')

        if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current?.width ?? 0, canvasRef.current?.height ?? 0)

            drawings.forEach((drawing) => {
                const node = nodes.find(({ nodeId }) => nodeId === drawing.nodeId)
                if (node) {
                    drawing.lines.forEach((line) => {
                        const offsetX = node.x - drawing.ref.x
                        const offsetY = node.y - drawing.ref.y
                        ctx.beginPath()
                        ctx.moveTo(line[0].x + offsetX, line[0].y + offsetY)
                        for (let i = 1; i < line.length; i++) {
                            ctx.lineTo(line[i].x + offsetX, line[i].y + offsetY)
                        }
                        ctx.strokeStyle = 'white'
                        ctx.stroke()
                    })
                }
            })

            currDrawing.lines.forEach((line) => {
                ctx.beginPath()
                ctx.moveTo(line[0].x, line[0].y)
                for (let i = 1; i < line.length; i++) {
                    ctx.lineTo(line[i].x, line[i].y)
                }
                ctx.strokeStyle = 'red'
                ctx.stroke()
            })
        }
    }, [nodes])

    const handleMouseDown: MouseEventHandler<HTMLCanvasElement> = (e) => {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            switch (mode) {
                case 'select':
                    const nodeId = getNearestNode(x, y)
                    const node = nodes.find((node) => node.nodeId == nodeId)
                    setCurrDrawing({ ...currDrawing, nodeId, ref: { x: node?.x ?? 0, y: node?.y ?? 0 } })
                    console.log(`Selected point (${x}, ${y}) with random number: ${nodeId}`)
                    break
                case 'draw':
                    setIsDrawing(true)
                    setCurrDrawing({ ...currDrawing, lines: [...currDrawing.lines, [{ x, y }]] })
                    break
                default:
            }
        }
    }

    const handleMouseMove: MouseEventHandler<HTMLCanvasElement> = (e) => {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            switch (mode) {
                case 'draw':
                    if (isDrawing) {
                        setCurrDrawing((prevDrawing) => {
                            const updatedLines = [...prevDrawing.lines]
                            const currLine = updatedLines[updatedLines.length - 1]
                            currLine.push({ x, y })
                            return { ...prevDrawing, lines: updatedLines }
                        })
                    }
                    break
                default:
            }
        }
    }

    const handleMouseUp = () => {
        setIsDrawing(false)
    }

    const handleMouseLeave = () => {
        setIsDrawing(false)
    }

    return (
        <>
            <div id="controls">
                <input
                    type="radio"
                    className="btn-check"
                    name="mode"
                    id="modebtn-idle"
                    checked={mode === 'idle'}
                    onChange={() => setMode('idle')} // Added onChange handler
                />
                <label className="btn" htmlFor="modebtn-idle">
                    Idle
                </label>
                <input
                    type="radio"
                    className="btn-check"
                    name="mode"
                    id="modebtn-select"
                    checked={mode === 'select'}
                    onChange={() => setMode('select')} // Added onChange handler
                />
                <label className="btn" htmlFor="modebtn-select">
                    Select
                </label>
                <input
                    type="radio"
                    className="btn-check"
                    name="mode"
                    id="modebtn-draw"
                    checked={mode === 'draw'}
                    onChange={() => setMode('draw')} // Added onChange handler
                />
                <label className="btn" htmlFor="modebtn-draw">
                    Draw
                </label>

                <div>{mode}</div>

                <button id="save" className="btn" onClick={() => handleSave()}>
                    Save
                </button>
            </div>
            <div id="container" style={{ position: 'relative' }}>
                <canvas
                    ref={canvasRef}
                    width="640"
                    height="480"
                    style={{ position: 'absolute', zIndex: 999 }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                ></canvas>
                <img src={`${SERVER}/video_feed`} style={{ width: 640, height: 480 }} />
            </div>
        </>
    )
}

export default App
