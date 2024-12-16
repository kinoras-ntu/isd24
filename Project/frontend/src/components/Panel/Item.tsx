import type { FC, ReactNode } from 'react'
import { ListGroup, ListGroupItem, type ListGroupItemProps } from 'react-bootstrap'

interface PanelItem extends ListGroupItemProps {
    name: ReactNode
}

const PanelItem: FC<PanelItem> = ({ name, children, style, ...restProps }) => {
    return (
        <ListGroupItem style={{ padding: 8, paddingBottom: 16, ...style }} {...restProps}>
            <h5 style={{ padding: 8, paddingBottom: 4, fontWeight: 'bold' }}>{name}</h5>
            <ListGroup>{children}</ListGroup>
        </ListGroupItem>
    )
}

export default PanelItem
