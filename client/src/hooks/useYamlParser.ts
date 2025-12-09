import { useMemo } from 'react';
import * as yaml from 'js-yaml';

export function useYamlParser(content: string) {
  const parsedTreeData = useMemo(() => {
    if (!content.trim()) {
      return null;
    }

    try {
      const parsed = yaml.load(content) as any;
      return parsed?.tree || null;
    } catch (error) {
      return null;
    }
  }, [content]);

  return parsedTreeData;
}

