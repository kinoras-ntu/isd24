import type { FC } from 'react'

import Board from '@/components/Board'
import ControlBar from '@/components/ControlBar'
import Panel from '@/components/Panel'
import Screen from '@/components/Screen'

const App: FC = () => {
    const [height, width] = [720, 1080]

    return (
        <div id="app" style={{ display: 'flex', gap: 16, margin: 16 }}>
            <main style={{ width }}>
                <ControlBar />
                <div style={{ position: 'relative', marginTop: 16 }}>
                    <Board
                        height={height}
                        width={width}
                        style={{ position: 'absolute', zIndex: 999, borderRadius: 6 }}
                    />
                    <Screen height={height} width={width} style={{ borderRadius: 6 }} />
                </div>
            </main>
            <Panel style={{ flex: 1 }} />
        </div>
    )
}

export default App
