import type { FC } from 'react'
import { Button, Dropdown, ListGroup, type ListGroupProps } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'

import { faUser } from '@fortawesome/free-regular-svg-icons'
import { faFlag } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import type { State, Tool } from '@/types/state'

import StageButton from './StageButton'

const tools: Tool[] = ['Binding', 'Trajectory']

const ControlBar: FC<ListGroupProps> = ({ ...restProps }) => {
    const tool = useSelector((state: State) => state.tool)
    const outline = useSelector((state: State) => state.outline)

    const dispatch = useDispatch()
    const setTool = (payload: Tool) => dispatch({ type: 'SET_TOOL', payload })
    const setOutline = (payload: boolean) => dispatch({ type: 'SET_OUTLINE', payload })
    const saveCurrentObject = () => dispatch({ type: 'SAVE_CURRENT_OBJECT' })

    return (
        <ListGroup data-bs-theme="dark" horizontal {...restProps}>
            <ListGroup.Item>
                <Button variant={outline ? 'light' : 'outline-light'} onClick={() => setOutline(!outline)}>
                    <FontAwesomeIcon icon={faUser} />
                </Button>
            </ListGroup.Item>
            <ListGroup.Item style={{ display: 'flex', flex: 1, gap: '1rem' }}>
                {/* Tool selector */}
                <Dropdown>
                    <Dropdown.Toggle variant="success" style={{ width: '9rem', display: 'flex', alignItems: 'center' }}>
                        <FontAwesomeIcon icon={faFlag} style={{ marginRight: '0.5rem' }} />
                        <span style={{ flex: 1, textAlign: 'left' }}>{tool}</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu style={{ minWidth: '9rem' }}>
                        {tools.map((tool) => (
                            <Dropdown.Item key={tool} onClick={() => setTool(tool)}>
                                {tool}
                            </Dropdown.Item>
                        ))}
                    </Dropdown.Menu>
                </Dropdown>
                {/* Stage selector */}
                <StageButton stage="Select" />
                <StageButton stage="Draw" />
            </ListGroup.Item>
            <ListGroup.Item>
                {/* Actions */}
                <Button onClick={saveCurrentObject}>Save</Button>
            </ListGroup.Item>
        </ListGroup>
    )
}

export default ControlBar
