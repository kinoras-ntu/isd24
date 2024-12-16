import type { FC } from 'react'
import { Button, type ButtonProps } from 'react-bootstrap'

import type { IconProp } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

interface EntryButtonProps extends ButtonProps {
    icon: IconProp
    iconStyle?: string
}

const EntryButton: FC<EntryButtonProps> = ({ icon, iconStyle, onClick, ...restProps }) => {
    return (
        <Button variant="dark" style={{ padding: 2, width: 29 }} onClick={onClick} {...restProps}>
            <FontAwesomeIcon size="sm" icon={icon} className={iconStyle ? `text-${iconStyle}` : undefined} />
        </Button>
    )
}

export default EntryButton
