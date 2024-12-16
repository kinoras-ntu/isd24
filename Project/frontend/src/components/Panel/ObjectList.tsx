import type { FC, ReactNode } from 'react'
import { ListGroup, ListGroupItem, type ListGroupItemProps } from 'react-bootstrap'

interface ObjectListProps extends ListGroupItemProps {
    name: ReactNode
}

const ObjectList: FC<ObjectListProps> = ({ name, children, style, ...restProps }) => {
    return (
        <ListGroupItem style={{ padding: 8, paddingBottom: 16, ...style }} {...restProps}>
            <h5 style={{ padding: 8, paddingBottom: 4, fontWeight: 'bold' }}>{name}</h5>
            <ListGroup>{children}</ListGroup>
        </ListGroupItem>
    )
}

export default ObjectList
