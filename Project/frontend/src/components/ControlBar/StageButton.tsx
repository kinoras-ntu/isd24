import type { FC } from 'react'
import { Button, type ButtonProps } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'

import { faArrowPointer, faPen, faQuestion } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import type { Stage, State } from '@/types/state'

interface StageButtonProps extends ButtonProps {
    stage: Stage
}

const Icon = {
    Idle: faQuestion,
    Select: faArrowPointer,
    Draw: faPen
}

const StageButton: FC<StageButtonProps> = ({ stage, ...restProps }) => {
    const currentStage = useSelector((state: State) => state.stage)

    const dispatch = useDispatch()
    const setStage = (payload: Stage) => dispatch({ type: 'SET_STAGE', payload })

    return (
        <Button
            variant={stage === currentStage ? 'light' : 'outline-light'}
            onClick={() => setStage(stage === currentStage ? 'Idle' : stage)}
            {...restProps}
        >
            <FontAwesomeIcon icon={Icon[stage]} width={12} />
            <span style={{ marginLeft: '0.5rem' }}>{stage}</span>
        </Button>
    )
}

export default StageButton
