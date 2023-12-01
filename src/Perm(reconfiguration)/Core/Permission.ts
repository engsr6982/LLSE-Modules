/**
 * 权限组实例 @author engsr6982
 */
export default class PermissionGroup {
    /**
     * 实例化Permission_Group
     * @param path 权限组保存路径 ./plugins/Perm/data.json
     * @param _default 启用默认组 (默认关闭)
     */
    constructor(path: string, _default: boolean = false) {
        this._path = path ? path : "./data/default.json";
        this._default = _default;
        this._data = new JsonConfigFile(this._path);
        // init data
        this._data.init("op", []);
        this._data.init("user", {});
        // init default group
        _default
            ? this._data.init("default", {
                  Perm: [],
              })
            : false;
    }

    _path: string;
    _default: boolean;
    _data: JsonConfigFile;

    // =========================== //
    //           私有方法           //
    // =========================== //

    /**
     * 获取OP列表
     */
    _getOPList(): Array<string> {
        return this._data.get("op");
    }
    /**
     * 获取用户列表
     */
    _getUserList(): _UserList {
        return this._data.get("user");
    }
    /**
     * 更新OP列表
     * @param newArray 新OP列表
     * @returns 是否更新成功
     */
    _updateOPList(newArray: Array<string>): boolean {
        return this._data.set("op", newArray);
    }
    /**
     * 更新User列表
     * @param newObject 新User列表
     * @returns 是否更新成功
     */
    _updateUserList(newObject: _UserList) {
        return this._data.set("user", newObject);
    }

    // =========================== //
    //           管理方法           //
    // =========================== //

    /**
     * 玩家是否为OP
     * @param xuid  OP xuid
     * @returns 是否为OP
     */
    isOP(xuid: string): boolean {
        return this._getOPList().indexOf(xuid) !== -1;
    }

    /**
     * 添加OP
     * @param xuid OP xuid
     * @returns 是否添加成功
     */
    addOP(xuid: string): boolean {
        const tmp = this._getOPList();
        if (!this.isOP(xuid)) {
            tmp.push(xuid);
            this._updateOPList(tmp);
            return true;
        }
        return false;
    }

    /**
     * 移除OP
     * @param xuid OP xuid
     * @returns 是否移除成功
     */
    deOP(xuid: string): boolean {
        const tmp = this._getOPList();
        const index = tmp.findIndex((op) => op === xuid);
        if (index !== -1) {
            tmp.splice(index, 1);
            this._updateOPList(tmp);
            return true;
        }
        return false;
    }

    // =========================== //
    //           用户方法           //
    // =========================== //

    /**
     * 名称是否合法 (允许1-16字节，允许中文字母数字下划线)
     * @param name
     * @returns 是否合法
     */
    _isTheNameLegal(name: string): boolean {
        return RegExp(/^[a-zA-Z0-9_\u4e00-\u9fa5]{1,16}$/g).test(name);
    }

    /**
     * 权限组是否存在
     * @param name 权限组名称
     * @returns 权限组是否存在
     */
    _isGroup(name: string): boolean {
        // return this._getUserList().hasOwnProperty(name);
        return Object.prototype.hasOwnProperty.call(this._getUserList(), name);
    }

    /**
     * 创建组
     * @param name 权限组名称
     * @returns 是否创建成功  抛出：非法名称
     */
    createGroup(name: string): boolean {
        if (this._isGroup(name)) return false;
        if (!this._isTheNameLegal(name)) throw new Error("Failed to create group! Invalid name!");
        const tmp = this._getUserList();
        tmp[name] = {
            Perm: [],
            User: [],
        };
        return this._updateUserList(tmp);
    }

    /**
     * 删除组
     * @param name 权限组名称
     * @returns 是否删除成功
     */
    deleteGroup(name: string): boolean {
        if (!this._isGroup(name)) return false;
        const tmp = this._getUserList();
        delete tmp[name];
        return this._updateUserList(tmp);
    }

    /**
     * 组是否拥有指定权限
     * @param name 权限组名称
     * @param perm 权限
     * @returns 是否拥有
     */
    _isGroupHasPerms(name: string, perm: string): boolean {
        if (!this._isGroup(name)) return false;
        const tmp = this._getUserList();
        const perms = tmp[name].Perm;
        return perms.some((p: string) => p === perm);
    }

    /**
     * 组是否拥有指定用户
     * @param name 权限组名称
     * @param user 用户
     * @returns 是否拥有
     */
    _isGroupHasUsers(name: string, user: string): boolean {
        if (!this._isGroup(name)) return false;
        const tmp = this._getUserList();
        const users = tmp[name].User;
        return users.some((u: string) => u === user);
    }

    /**
     * 添加权限
     * @param name 权限组名称
     * @param perm 权限
     * @param 是否添加成功
     */
    addPerm(name: string, perm: string): boolean {
        if (!this._isGroup(name)) return false;
        if (this._isGroupHasPerms(name, perm)) return false;
        const tmp = this._getUserList();
        tmp[name].Perm.push(perm);
        return this._updateUserList(tmp);
    }

    /**
     * 删除权限
     * @param name 权限组名称
     * @param perm 权限
     * @returns 是否删除成功
     */
    deletePerm(name: string, perm: string): boolean {
        if (!this._isGroup(name)) return false;
        if (!this._isGroupHasPerms(name, perm)) return false;
        const tmp = this._getUserList();
        tmp[name].Perm.splice(
            tmp[name].Perm.findIndex((i: string) => i === perm),
            1,
        );
        return this._updateUserList(tmp);
    }

    /**
     * 添加用户
     * @param name 权限组名称
     * @param xuid 用户xuid
     * @returns 是否添加成功
     */
    addUser(name: string, xuid: string): boolean {
        if (!this._isGroup(name)) return false;
        if (this._isGroupHasUsers(name, xuid)) return false;
        const tmp = this._getUserList();
        tmp[name].User.push(xuid);
        return this._updateUserList(tmp);
    }

    /**
     * 删除用户
     * @param name 权限组名称
     * @param xuid 用户xuid
     * @returns 是否删除成功
     */
    deleteUser(name: string, xuid: string): boolean {
        if (!this._isGroup(name)) return false;
        if (!this._isGroupHasUsers(name, xuid)) return false;
        const tmp = this._getUserList();
        tmp[name].User.splice(
            tmp[name].User.findIndex((i: string) => i === xuid),
            1,
        );
        return this._updateUserList(tmp);
    }

    /**
     * 用户是否在指定权限组内
     * @param name 权限组名称
     * @param xuid 用户xuid
     * @returns 是否存在
     */
    isUserInGroup(name: string, xuid: string): boolean {
        if (!this._isGroup(name)) return false;
        return this._isGroupHasUsers(name, xuid);
    }

    /**
     * 获取用户所在权限组
     * @param xuid 用户xuid
     * @returns 包含指定用户的所有用户组，如果用户不在任何权限组中则返回null
     */
    getUserInGroup(xuid: string): _UserInGroup | null {
        const tmp = this._getUserList();
        const result = [];
        for (const key in tmp) {
            const userIndex = tmp[key].User.indexOf(xuid);
            if (userIndex !== -1) {
                result.push({ name: key, data: tmp[key] });
            }
        }
        return result.length ? result : null;
    }

    /**
     * 获取所有权限组
     * @returns 权限组名称 [name, name, ...]
     */
    getAllGroup(): Array<string> {
        return Object.keys(this._getUserList());
    }

    /**
     * 获取指定权限组
     * @param name 权限组名称
     * @returns 权限组 不存在返回Null
     */
    getGroup(name: string): _GroupItem {
        return this._getUserList()[name] || null;
    }

    /**
     * 重命名一个权限组
     * @param name 权限组名称
     * @param newName 新的权限组名称
     * @returns 是否成功
     */
    reNameGroup(name: string, newName: string): boolean {
        if (!this._isGroup(name)) return false;
        if (!this._isTheNameLegal(newName)) return false;
        const tmp = this._getUserList();
        if (tmp[newName]) return false; // 新的权限组名称已存在
        tmp[newName] = tmp[name];
        delete tmp[name];
        this._updateUserList(tmp);
        return true;
    }

    // =========================== //
    //           默认方法           //
    // =========================== //

    _getDefault(): _GroupItem {
        return this._data.get("default");
    }

    _updateDefault(newDefault: _GroupItem) {
        return this._data.set("default", newDefault);
    }

    /**
     * 添加一个权限到默认组
     * @param perm 权限值
     */
    addDefaultPerm(perm: string): boolean {
        // if (!this._default) return false;
        if (this.hasDefaultPerm(perm)) return false;
        const def = this._getDefault();
        def.Perm.push(perm);
        return this._updateDefault(def);
    }

    /**
     * 从默认组删除一个权限
     * @param perm 权限值
     */
    deleteDefaultPerm(perm: string): boolean {
        if (!this.hasDefaultPerm(perm)) return false;
        const def = this._getDefault();
        def.Perm.splice(
            def.Perm.findIndex((p) => p === perm),
            1,
        );
        return this._updateDefault(def);
    }

    /**
     * 默认组是否拥有指定权限
     * @param perm 权限值
     */
    hasDefaultPerm(perm: string): boolean {
        const def = this._getDefault();
        return def.Perm.some((p) => p === perm);
    }

    // =========================== //
    //           通用方法           //
    // =========================== //

    /**
     * 用户是否拥有指定权限
     * @param xuid 权限组名称
     * @param perm 权限
     * @param _def 是否启用默认组
     * @return 是否拥有权限
     */
    hasUserPerm(xuid: string, perm: string, _def: boolean = true): boolean {
        const tmp = this.getUserInGroup(xuid); // 获取用户所在组
        if (tmp) {
            // 获取成功  检查组内
            for (let i = 0; i < tmp.length; i++) {
                if (tmp[i].data.Perm.indexOf(perm) !== -1) {
                    return true;
                }
            }
        }
        // default
        return _def && this._default ? this.hasDefaultPerm(perm) : false;
    }
}
