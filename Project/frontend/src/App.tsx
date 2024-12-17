import type { FC } from 'react'
import { Button } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'

import { faDownLeftAndUpRightToCenter } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { DisplayMode, State } from '@/types/state'

import Board from '@/components/Board'
import ControlBar from '@/components/ControlBar'
import Panel from '@/components/Panel'
import Screen from '@/components/Screen'

const App: FC = () => {
    const displayMode = useSelector((state: State) => state.displayMode)

    const dispatch = useDispatch()
    const setDisplayMode = (payload: DisplayMode) => dispatch({ type: 'SET_DISPLAY_MODE', payload })

    const [height, width] = [720, 1280]

    return (
        <div id="app" style={{ display: 'flex', gap: 16, margin: 16 }}>
            <main style={{ width }}>
                <ControlBar />
                <div
                    style={
                        displayMode === 'Normal'
                            ? { position: 'relative', marginTop: 16 }
                            : {
                                  position: 'absolute',
                                  left: '50%',
                                  top: '50%',
                                  transform: `translate(-50%, -50%) scale(${window.innerWidth / 1280})`,
                                  zIndex: 999
                              }
                    }
                >
                    <Board height={height} width={width} />
                    <Screen height={height} width={width} />
                    {displayMode === 'Fullscreen' && (
                        <Button
                            variant="light"
                            style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 1099 }}
                            onClick={() => setDisplayMode('Normal')}
                        >
                            <FontAwesomeIcon icon={faDownLeftAndUpRightToCenter} />
                        </Button>
                    )}
                </div>
                {displayMode === 'Fullscreen' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'black', zIndex: 99 }} />
                )}
            </main>
            <Panel style={{ flex: 1 }} />
        </div>
    )
}

export default App
