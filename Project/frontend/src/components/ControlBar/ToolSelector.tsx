import type { FC } from 'react'
import { Dropdown, type DropdownProps } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'

import { faFlag } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import type { State, Tool } from '@/types/state'

const tools: Tool[] = ['Binding', 'Trajectory']

const { Toggle, Menu, Item } = Dropdown

const ToolSelector: FC<Omit<DropdownProps, 'children'>> = ({ ...restProps }) => {
    const tool = useSelector((state: State) => state.tool)

    const dispatch = useDispatch()
    const setTool = (payload: Tool) => dispatch({ type: 'SET_TOOL', payload })
    return (
        <Dropdown {...restProps}>
            <Toggle variant="success" style={{ width: '9rem', display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faFlag} style={{ marginRight: '0.5rem' }} />
                <span style={{ flex: 1, textAlign: 'left' }}>{tool}</span>
            </Toggle>
            <Menu style={{ minWidth: '9rem' }}>
                {tools.map((tool) => (
                    <Item key={tool} onClick={() => setTool(tool)}>
                        {tool}
                    </Item>
                ))}
            </Menu>
        </Dropdown>
    )
}

export default ToolSelector
