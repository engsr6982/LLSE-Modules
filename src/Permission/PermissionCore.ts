export default class PermissionCore {
    private hasKeyinObject(object: object, key: string): boolean {
        return Object.prototype.hasOwnProperty.call(object, key);
    }

    /** 是否启用公共组 */
    isPublicGroup: boolean;
    /** 存储路径 */
    private storagePath: string;
    /** 文件缓存 */
    permissionFileCache: PermissionFileJSON;

    constructor(storagePath: string, isPublicGroup: boolean = false) {
        this.storagePath = storagePath;
        this.isPublicGroup = isPublicGroup;
        this.readPermissionFile();
        this.initPublicGroup();
    }

    /**
     * 读取权限文件
     * @returns 是否读取成功
     */
    readPermissionFile(): boolean {
        if (!file.exists(this.storagePath)) {
            // 文件不存在
            file.writeTo(
                this.storagePath,
                JSON.stringify({
                    adminGroup: [],
                    userGroup: [],
                })
            );
        }
        // 读取文件
        this.permissionFileCache = JSON.parse(file.readFrom(this.storagePath));
        return true;
    }

    /**
     * 保存权限文件
     * @returns 是否保存成功
     */
    savePermissionFile(): boolean {
        return file.writeTo(this.storagePath, JSON.stringify(this.permissionFileCache));
    }

    // ====================================================================================================

    /**
     * 初始化公共组
     * @returns 是否初始化成功
     */
    private initPublicGroup(): boolean {
        if (this.isPublicGroup === false) return false;
        if (this.hasKeyinObject(this.permissionFileCache, "publicGroup")) return false;
        this.permissionFileCache["publicGroup"] = {
            authority: [],
        };
        return this.savePermissionFile();
    }

    //! 管理员接口

    /**
     * 获取所有管理员
     * @returns 所有管理员
     */
    getAllAdmins() {
        return this.permissionFileCache.adminGroup;
    }

    /**
     * 检查用户是否是管理员
     * @param xuid 用户xuid
     * @returns 是否是管理员
     */
    isAdmin(xuid: string): boolean {
        return this.permissionFileCache.adminGroup.indexOf(xuid) !== -1;
    }

    /**
     * 添加一个管理员
     * @param xuid 用户xuid
     * @returns 是否添加成功
     */
    addAdmin(xuid: string): boolean {
        if (this.isAdmin(xuid)) return false;
        this.permissionFileCache.adminGroup.push(xuid);
        return this.savePermissionFile();
    }

    /**
     * 移除一个管理员
     * @param xuid 用户xuid
     * @returns 是否移除成功
     */
    removeAdmin(xuid: string): boolean {
        if (!this.isAdmin(xuid)) return false;
        const { adminGroup } = this.permissionFileCache;
        this.permissionFileCache.adminGroup.splice(
            adminGroup.findIndex((xuids) => xuids === xuid),
            1
        );
        return this.savePermissionFile();
    }

    //! 用户组接口

    /**
     * 检查名称合法性 (允许1-16字节，允许中文字母数字下划线)
     * @param name 名称
     * @returns 是否合法
     */
    private _isTheNameLegal(name: string): boolean {
        return RegExp(/^[a-zA-Z0-9_\u4e00-\u9fa5]{1,16}$/g).test(name);
    }

    /**
     * 组是否存在
     * @param name 权限组名称
     * @returns 是否存在
     */
    isGroupExist(name: string): boolean {
        return this.permissionFileCache.userGroup.some((i) => i.groupName === name);
    }

    /**
     * 获取组
     * @param name 组名称
     * @returns 组
     */
    getGroup(name: string): GetGroupType | null {
        if (!this.isGroupExist(name)) return null;
        const { userGroup } = this.permissionFileCache;
        const index = userGroup.findIndex((i) => i.groupName === name);
        if (index !== -1) {
            return {
                index: index,
                group: this.permissionFileCache.userGroup[index],
            };
        }
        return null;
    }

    /**
     * 获取所有组
     * @returns 用户组列表
     */
    getAllGroups(): Array<UserGroupElements> {
        return this.permissionFileCache.userGroup;
    }

    /**
     * 创建组
     * @param name 组名称
     * @returns 是否创建成功
     */
    createGroup(name: string): boolean {
        if (this.isGroupExist(name)) return false;
        if (!this._isTheNameLegal(name)) return false;
        this.permissionFileCache.userGroup.push({
            groupName: name,
            authority: [],
            user: [],
        });
        return this.savePermissionFile();
    }

    /**
     * 删除组
     * @param name 组名称
     * @returns 是否删除成功
     */
    deleteGroup(name: string): boolean {
        if (!this.isGroupExist(name)) return false;
        const { index } = this.getGroup(name);
        this.permissionFileCache.userGroup.splice(index, 1);
        return this.savePermissionFile();
    }

    /**
     * 重命名组
     * @param name 组名称
     * @param newGroupName 新的组名称
     * @returns 是否重命名成功
     */
    renameGroup(name: string, newGroupName: string): boolean {
        if (!this.isGroupExist(name)) return false;
        if (!this._isTheNameLegal(newGroupName)) return false;
        const { index } = this.getGroup(name);
        this.permissionFileCache.userGroup[index].groupName = newGroupName;
        return this.savePermissionFile();
    }

    /**
     * 指定组是否有指定权限
     * @param name 组名称
     * @param authority 权限
     * @returns 是否拥有
     */
    groupHasSpecifiedPermissions(name: string, authority: string): boolean {
        if (!this.isGroupExist(name)) return false;
        const group = this.getGroup(name);
        if (group === null) return false;
        return group.group.authority.some((i) => i === authority);
    }

    /**
     * 给组添加权限
     * @param name 组名称
     * @param authority 权限
     * @returns 是否添加成功
     */
    groupAddPermissions(name: string, authority: string): boolean {
        if (!this.isGroupExist(name)) return false; // 组不存在
        if (!this._isThePermissionLegal(authority)) return false; // 权限不合法
        if (this.groupHasSpecifiedPermissions(name, authority)) return false; // 权限已添加
        const { index } = this.getGroup(name);
        this.permissionFileCache.userGroup[index].authority.push(authority);
        return this.savePermissionFile();
    }

    /**
     * 给组删除权限
     * @param name 组名称
     * @param authority 权限
     * @returns 是否删除成功
     */
    groupDeletePermissions(name: string, authority: string): boolean {
        if (!this.isGroupExist(name)) return false;
        if (!this.groupHasSpecifiedPermissions(name, authority)) return false;
        const { index, group } = this.getGroup(name);
        this.permissionFileCache.userGroup[index].authority.splice(
            group.authority.findIndex((i) => i === authority),
            1
        );
        return this.savePermissionFile();
    }

    /**
     * 指定组是否有指定用户
     * @param name 组名称
     * @param xuid 用户xuid
     * @returns 是否拥有
     */
    groupHasSpecifiedUsers(name: string, xuid: string): boolean {
        if (!this.isGroupExist(name)) return false;
        const group = this.getGroup(name);
        if (group === null) return false;
        return group.group.user.some((i) => i === xuid);
    }

    /**
     * 给组添加用户
     * @param name 组名称
     * @param xuid 用户xuid
     * @returns 是否添加成功
     */
    groupAddUser(name: string, xuid: string): boolean {
        if (!this.isGroupExist(name)) return false;
        if (this.groupHasSpecifiedUsers(name, xuid)) return false;
        const { index } = this.getGroup(name);
        this.permissionFileCache.userGroup[index].user.push(xuid);
        return this.savePermissionFile();
    }

    /**
     * 给组删除用户
     * @param name 组名称
     * @param xuid 用户xuid
     * @returns 是否删除成功
     */
    groupDeleteUser(name: string, xuid: string): boolean {
        if (!this.isGroupExist(name)) return false;
        if (!this.groupHasSpecifiedUsers(name, xuid)) return false;
        const { index, group } = this.getGroup(name);
        this.permissionFileCache.userGroup[index].user.splice(
            group.user.findIndex((i) => i === xuid),
            1
        );
        return this.savePermissionFile();
    }

    /**
     * 获取拥有用户的组
     * @param xuid 用户xuid
     * @returns 组
     */
    getUserGroups(xuid: string): Array<UserGroupElements> {
        const data: Array<UserGroupElements> = [];
        const { userGroup } = this.permissionFileCache;
        for (let i = 0; i < userGroup.length; i++) {
            const group = userGroup[i];
            if (!group.user.some((u) => u === xuid)) continue;
            data.push(group);
        }
        return data;
    }

    /**
     * 获取用户拥有的权限
     * @param xuid 用户xuid
     * @returns 权限
     */
    getUserPermissions(xuid: string): GetUserPermissionsType {
        const data: GetUserPermissionsType = {
            authority: [],
            source: {},
        };
        const group = this.getUserGroups(xuid); // 获取拥有用户的组
        for (let i = 0; i < group.length; i++) {
            if (group[i].authority.length === 0) continue; // 组没有权限 跳过

            group[i].authority.forEach((perm) => {
                if (!data.authority.some((data_perm) => data_perm === perm)) {
                    // 组的权限已未加进待返回缓存中
                    data.authority.push(perm); // 添加进所有权限里
                }

                if (!this.hasKeyinObject(data.source, perm)) {
                    data.source[perm] = []; // 初始化来源[]
                }

                if (!data.source[perm].some((source_array_groupName) => source_array_groupName === group[i].groupName)) {
                    data.source[perm].push(group[i].groupName); // 添加来源 组名到数组
                }
            });
        }
        return data;
    }

    //! 公共组接口

    /**
     * 获取公共组权限
     * @returns 权限
     */
    getPublicGroupPermissions(): Array<string> {
        return this.permissionFileCache.publicGroup.authority;
    }

    /**
     * 公共组是否有指定权限
     * @param authority 权限
     * @returns 是否拥有
     */
    hasSpecificPermissionsInPublicGroup(authority: string): boolean {
        return this.getPublicGroupPermissions().some((p) => p === authority);
    }

    /**
     * 公共组添加权限
     * @param authority 权限
     * @returns 是否添加成功
     */
    publicGroupAddPermissions(authority: string): boolean {
        if (!this._isThePermissionLegal(authority)) return false;
        if (this.hasSpecificPermissionsInPublicGroup(authority)) return false;
        this.permissionFileCache.publicGroup.authority.push(authority);
        return this.savePermissionFile();
    }

    /**
     * 公共组删除权限
     * @param authority 权限
     * @returns 是否删除成功
     */
    publicGroupDeletePermissions(authority: string): boolean {
        if (!this.hasSpecificPermissionsInPublicGroup(authority)) return false;
        this.permissionFileCache.publicGroup.authority.splice(
            this.permissionFileCache.publicGroup.authority.findIndex((p) => p === authority),
            1
        );
        return this.savePermissionFile();
    }

    //! 其他接口
    /**
     * 用户是否有指定权限
     * @param xuid 用户xuid
     * @param authority 权限
     * @param publicGroup 是否检查公共组中的权限
     * @returns 是否有权限
     */
    checkUserPermission(xuid: string, authority: string, publicGroup: boolean = this.isPublicGroup) {
        if (this.getUserPermissions(xuid).authority.some((p) => p === authority)) {
            return true;
        }
        return publicGroup && this.isPublicGroup ? this.hasSpecificPermissionsInPublicGroup(authority) : false;
    }

    //! 权限注册接口

    /**
     * 权限是否合法（6~12位，允许数字、字母）
     * @param authority 权限
     * @returns 是否合法
     */
    private _isThePermissionLegal(authority: string): boolean {
        return RegExp(/^[a-zA-Z0-9]{6,12}$/g).test(authority);
    }

    /** 所有已权限 */
    private allPermissions: Array<RegPermissionElement> = [];

    /**
     * 获取所有注册权限
     * @returns 权限列表
     */
    getAllPermissions(): Array<RegPermissionElement> {
        return this.allPermissions;
    }

    /**
     * 获取一个权限
     * @param value 权限值
     * @returns 权限对象
     */
    getPermission(value: string): RegPermissionElement | null {
        const index = this.allPermissions.findIndex((i) => i.value === value);
        return index !== -1 ? this.allPermissions[index] : null;
    }

    /**
     * 权限是否已注册
     * @param authority 权限
     * @returns 是否注册
     */
    isThePermissionRegistered(authority: string): boolean {
        return this.allPermissions.some((i) => i.value === authority);
    }

    /**
     * 注册权限
     * @param name 权限名
     * @param authority 权限值
     * @returns 是否注册成功
     */
    registrationPermissions(name: string, authority: string): boolean {
        if (!this._isTheNameLegal(name)) return false; // 名称不合法
        if (!this._isThePermissionLegal(authority)) return false; // 权限值不合法
        if (this.isThePermissionRegistered(authority)) return false; // 权限值已注册
        this.allPermissions.push({
            name: name,
            value: authority,
        });
        return true;
    }

    /**
     * 取消注册权限
     * @param authority 权限
     * @returns 是否取消成功
     */
    unRegistrationPermissions(authority: string): boolean {
        if (!this.isThePermissionRegistered(authority)) return false;
        this.allPermissions.splice(
            this.allPermissions.findIndex((i) => i.value === authority),
            1
        );
        return true;
    }
}
