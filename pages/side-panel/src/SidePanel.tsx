import '@src/SidePanel.css';
import { t } from '@extension/i18n';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage, handScoreStorage, mahjongGameStateStorage } from '@extension/storage';
import { cn, ErrorDisplay, LoadingSpinner, ToggleButton } from '@extension/ui';

const SidePanel = () => {
  const { isLight } = useStorage(exampleThemeStorage);
  const gameState = useStorage(mahjongGameStateStorage);
  const handScore = useStorage(handScoreStorage);

  return (
    <div className={cn('App', isLight ? 'bg-slate-50' : 'bg-gray-800')}>
      <header className={cn('App-header', isLight ? 'text-gray-900' : 'text-gray-100')}>
        <ToggleButton onClick={exampleThemeStorage.toggle}>{t('toggleTheme')}</ToggleButton>
        <div style={{ marginTop: 24, textAlign: 'left', width: '100%' }}>
          <h3>Hand Score</h3>
          {handScore === 0 ? (
            <span>Loading...</span>
          ) : (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{handScore}</pre>
          )}
          <h3>Mahjong Game State</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(gameState, null, 2)}</pre>
        </div>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <LoadingSpinner />), ErrorDisplay);
