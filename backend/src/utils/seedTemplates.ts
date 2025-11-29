import { controllerTemplates } from '../modules/hardware/ControllerTemplateManager';

export const seedControllerTemplates = async () => {
    await controllerTemplates.loadTemplates();
};
