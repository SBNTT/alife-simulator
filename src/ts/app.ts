import * as elements from "./elements";
import {Engine} from "./engine";

const engine = new Engine();

elements.playButton.onclick = () => engine.play();
elements.pauseButton.onclick = () => engine.pause();
elements.reloadButton.onclick = () => engine.reload();
elements.settingsButton.onclick = () => engine.openSettings();
elements.closeSettingsButton.onclick = () => engine.closeSettings();
