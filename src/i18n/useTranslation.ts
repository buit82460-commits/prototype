import { useMiroStore } from '../stores/useMiroStore';
import { getDict } from './translations';

export function useTranslation() {
  const language = useMiroStore((s) => s.settings.language);
  const dict = getDict(language);
  return { t: dict, language };
}
