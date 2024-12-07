import type { FC } from 'react'
import { Button, type ButtonProps } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'

import { faArrowPointer, faPen, faQuestion } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import type { Stage, State } from '@/types/state'

interface SaveButtonProps extends ButtonProps {
    main: boolean
}

const Icon = {
    Idle: faQuestion,
    Select: faArrowPointer,
    Draw: faPen
}

const SaveButton: FC<SaveButtonProps> = ({ children, main, ...restProps }) => {
    const currentStage = useSelector((state: State) => state.stage)

    const dispatch = useDispatch()
    const setStage = (payload: Stage) => dispatch({ type: 'SET_STAGE', payload })

    return (
        <Button
            variant={main ? 'light' : 'outline-light'}
            // onClick={() => setStage(stage === currentStage ? 'Idle' : stage)}
            {...restProps}
        >
            {/* <FontAwesomeIcon icon={Icon[stage]} width={12} /> */}
            <span style={{ marginLeft: '0.5rem' }}>{children}</span>
        </Button>
    )
}

export default SaveButton
