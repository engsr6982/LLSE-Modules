import PermissionGroup from "./Core/Permission.js";
import PermGroup_Form from "./GUI/Form.js";
export let _Perm_Object;
export let perm = null;
export let perm_Form = null;
export let GUI_Title = null;
interface _InitModulePerm {
    /** 权限组实例 */
    perm: {
        /** 文件存储路径 */
        path: string;
        /** 是否启用default组 */
        default: boolean;
    };
    /** 权限组表单实例-语言包路径 */
    permForm: string;
    /** 权限组表单标题 */
    formTitle: string;
}
export function initModulePerm(initData: _InitModulePerm, perm_Object: object) {
    const {
        perm: { path, default: defaultValue },
        permForm,
        formTitle,
    } = initData;
    _Perm_Object = perm_Object;
    GUI_Title = formTitle;
    perm_Form = new PermGroup_Form(permForm);
    perm = new PermissionGroup(path, defaultValue);
}
