import type { FC } from 'react'
import { ToggleButton, type ToggleButtonProps } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'

import type { State } from '@/types/state'

interface StrokeWidthRadioProps extends Omit<ToggleButtonProps, 'id' | 'value'> {
    width: number
    displaySize: number
}

const StrokeWidthRadio: FC<StrokeWidthRadioProps> = ({ width, displaySize, ...restProps }) => {
    const currentStrokeWidth = useSelector((state: State) => state.strokeWidth)
    const active = currentStrokeWidth === width

    const dispatch = useDispatch()
    const setStrokeWidth = (payload: number) => dispatch({ type: 'SET_STROKE_WIDTH', payload })

    return (
        <ToggleButton
            id={`control-strokewidth-${width}`}
            type="radio"
            value={width}
            checked={active}
            style={{
                width: displaySize,
                height: displaySize,
                padding: 0,
                borderRadius: displaySize,
                backgroundColor: active ? '#ffffff' : '#495057',
                borderColor: '#495057',
                borderWidth: 2
            }}
            onChange={(e) => setStrokeWidth(Number(e.currentTarget.value))}
            {...restProps}
        />
    )
}

export default StrokeWidthRadio
