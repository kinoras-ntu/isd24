import { type FC } from 'react'
import { useSelector } from 'react-redux'

import type { State } from '@/types/state'

import Board from '@/components/Board'
import ControlBar from '@/components/ControlBar'

const App: FC = () => {
    const state = useSelector((state: State) => state)

    return (
        <>
            <ControlBar />
            <Board height={640} width={960} />
            {JSON.stringify(state)}
        </>
    )
}

export default App
