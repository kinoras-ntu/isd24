import type { FC } from 'react'
import { Button, Form, ListGroup, type ListGroupProps } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'

import { faPaperPlane, faPlus, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import type { Color } from '@/types/drawing'
import type { State } from '@/types/state'

import ObjectItem from './ObjectItem'

const { Item } = ListGroup

const Panel: FC<ListGroupProps> = ({ ...restProps }) => {
    const tool = useSelector((state: State) => state.tool)
    const finishedObjects = useSelector((state: State) => state.finishedObjects[tool])
    const outline = useSelector((state: State) => state.outline)
    const color = useSelector((state: State) => state.color)
    const currentObject = useSelector((state: State) => state.currentObject)

    const dispatch = useDispatch()

    const handleSelectTab = (key: string | null) => {
        alert(`Selected tab: ${key}`)
    }

    return (
        <ListGroup data-bs-theme="dark" {...restProps}>
            <Item style={{ padding: 8 }}>
                <h5 style={{ padding: 8, fontWeight: 'bold' }}>Current Drawing</h5>
                <ListGroup>
                    <ObjectItem object={currentObject} />
                </ListGroup>
            </Item>
            <Item style={{ padding: 16 }}>
                <h5 style={{ fontWeight: 'bold' }}>Finished Drawing</h5>
            </Item>
        </ListGroup>
    )
}

export default Panel
