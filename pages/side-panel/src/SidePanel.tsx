import '@src/SidePanel.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage, handScoreStorage, mahjongGameStateStorage } from '@extension/storage';
import { cn, ErrorDisplay, LoadingSpinner } from '@extension/ui';

const SidePanel = () => {
  const { isLight } = useStorage(exampleThemeStorage);
  const gameState = useStorage(mahjongGameStateStorage);
  const handScoreResult = useStorage(handScoreStorage);
  const handScore = handScoreResult.score;

  return (
    <div className={cn('App', isLight ? 'bg-slate-50' : 'bg-gray-800')}>
      <header className={cn('App-header', isLight ? 'text-gray-900' : 'text-gray-100')}>
        <div style={{ textAlign: 'left', width: '100%' }}>
          <h3 className="my-2 text-lg font-bold">Hand Score</h3>
          {handScore === 0 ? (
            <span>Loading...</span>
          ) : (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{handScore}</pre>
          )}
          <h3 className="my-2 text-lg font-bold">Matched Rules</h3>
          {handScoreResult.matched.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '4px' }}>Name</th>
                  <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '4px' }}>Count</th>
                  <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '4px' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {handScoreResult.matched.map(({ name, points, quant }, idx) => (
                  <tr key={idx}>
                    <td style={{ borderBottom: '1px solid #eee', padding: '4px' }}>{name}</td>
                    <td style={{ borderBottom: '1px solid #eee', padding: '4px' }}>{quant}</td>
                    <td style={{ borderBottom: '1px solid #eee', padding: '4px' }}>{points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <span>No rules matched</span>
          )}
          <h3 className="my-2 text-lg font-bold">Mahjong Game State</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(gameState, null, 2)}</pre>
        </div>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <LoadingSpinner />), ErrorDisplay);
