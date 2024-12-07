import type { FC } from 'react'
import { useSelector } from 'react-redux'

import { State } from '@/types/state'

import Board from '@/components/Board'
import ControlBar from '@/components/ControlBar'
import Screen from '@/components/Screen'

const App: FC = () => {
    const [height, width] = [720, 1280]

    return (
        <div id="app" style={{ width, margin: '16px auto' }}>
            <ControlBar />
            {/* {JSON.stringify(useSelector((state: State) => state).currentObject)} */}
            <div style={{ position: 'relative', marginTop: '1rem' }}>
                <Board height={height} width={width} style={{ position: 'absolute', zIndex: 999 }} />
                <Screen height={height} width={width} />
            </div>
        </div>
    )
}

export default App
