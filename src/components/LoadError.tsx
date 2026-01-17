import { Button } from './ui/Button';

interface LoadErrorProps {
  title: string;
  message: string;
  source?: string;
  onDismiss: () => void;
  onRetry?: () => void;
}

export const LoadError = ({ title, message, source, onDismiss, onRetry }: LoadErrorProps): React.ReactElement => (
  <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
    <h4 className="text-red-400 font-medium text-sm">{title}</h4>
    <p className="text-red-300/70 text-xs mt-1">{message}</p>
    {source && <p className="text-red-300/50 text-[11px] mt-1">Source: {source}</p>}
    <div className="flex gap-2 mt-3">
      <Button onClick={onDismiss} size="sm" variant="secondary">
        Dismiss
      </Button>
      {onRetry && (
        <Button onClick={onRetry} size="sm" variant="secondary">
          Retry
        </Button>
      )}
    </div>
  </div>
);
