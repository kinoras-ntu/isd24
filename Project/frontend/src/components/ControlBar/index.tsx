import type { FC } from 'react'
import { Button, Form, ListGroup, type ListGroupProps } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'

import { faPaperPlane, faPlus, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import type { Color } from '@/types/drawing'
import type { State } from '@/types/state'

import StageButton from './StageButton'
import StrokeWidthRadio from './StrokeWidthRadio'
import ToolSelector from './ToolSelector'

const { Item } = ListGroup

const ControlBar: FC<ListGroupProps> = ({ ...restProps }) => {
    const tool = useSelector((state: State) => state.tool)
    const outline = useSelector((state: State) => state.outline)
    const color = useSelector((state: State) => state.color)
    const currentObject = useSelector((state: State) => state.currentObject)

    const dispatch = useDispatch()
    const setOutline = (payload: boolean) => dispatch({ type: 'SET_OUTLINE', payload })
    const setColor = (payload: Color) => dispatch({ type: 'SET_COLOR', payload })
    const saveCurrentObject = () => dispatch({ type: 'SAVE_CURRENT_OBJECT' })
    const saveFrame = () => dispatch({ type: 'SAVE_FRAME' })

    const canDraw =
        (tool === 'Triggering' && currentObject.refNode.length === 2) ||
        (tool !== 'Triggering' && currentObject.refNode.length === 1)

    return (
        <ListGroup data-bs-theme="dark" horizontal {...restProps}>
            <Item style={{ display: 'flex', flex: 1, gap: '1rem' }}>
                <ToolSelector />
                <StageButton stage="Select" />
                <StageButton stage="Draw" disabled={!canDraw} activeTools={['Binding', 'Flipbook', 'Triggering']} />
                <span className="spacer" style={{ flex: 1 }} />
                {tool === 'Flipbook' && (
                    <Button variant="outline-light" onClick={saveFrame}>
                        <FontAwesomeIcon icon={faPlus} />
                        <span style={{ marginLeft: 8 }}>Frame</span>
                    </Button>
                )}
                <Button variant="light" onClick={saveCurrentObject} disabled={!canDraw}>
                    <FontAwesomeIcon icon={faPaperPlane} />
                    <span style={{ marginLeft: 8 }}>Save</span>
                </Button>
            </Item>
            <Item style={{ display: 'flex', gap: 16 }}>
                <Form.Control
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.currentTarget.value)}
                    style={{ borderWidth: 2, padding: 4, width: 38 }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StrokeWidthRadio width={2} displaySize={16} />
                    <StrokeWidthRadio width={4} displaySize={24} />
                    <StrokeWidthRadio width={8} displaySize={32} />
                </div>
            </Item>
            <Item>
                <Button variant={outline ? 'light' : 'outline-light'} onClick={() => setOutline(!outline)}>
                    <FontAwesomeIcon icon={faUser} />
                    <span style={{ marginLeft: 8 }}>Outline</span>
                </Button>
            </Item>
        </ListGroup>
    )
}

export default ControlBar
