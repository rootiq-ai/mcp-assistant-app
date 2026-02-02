import { AppPlugin } from '@grafana/data';
import { App } from './components/App';
import { initSidebar } from './components/Sidebar';

initSidebar();

export const plugin = new AppPlugin().setRootPage(App);
