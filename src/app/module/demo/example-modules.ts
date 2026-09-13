import { Compute } from '../compute/compute';
import { ModuleDefinition } from '../module-definition';
import { createModuleA } from './module-a';
import { createModuleB } from './module-b';
import { createModuleC } from './module-c';
import { createModuleD } from './module-d';
import { createModuleE } from './module-e';

export function createExampleModules(compute: Compute): ModuleDefinition[] {
  return [
    createModuleA(compute),
    createModuleB(compute),
    createModuleC(compute),
    createModuleD(compute),
    createModuleE(compute),
  ];
}
