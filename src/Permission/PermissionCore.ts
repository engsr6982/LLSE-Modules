export default class PermissionCore {
    private checkKeyInObject(object: object, key: string): boolean {
        return Object.prototype.hasOwnProperty.call(object, key);
    }

    /** Enable Public Group */
    isPublicGroupEnabled: boolean;
    /** Storage Path */
    private pathForStorage: string;
    /** File Cache */
    private permissionFileCache: PermissionFileJSON;

    constructor(pathForStorage: string, isPublicGroupEnabled: boolean = false) {
        this.pathForStorage = pathForStorage;
        this.isPublicGroupEnabled = isPublicGroupEnabled;
        this.loadPermissionFile();
        this.initializePublicGroup();
    }

    /**
     * Load Permission File
     * @returns Success status
     */
    private loadPermissionFile(): boolean {
        if (!file.exists(this.pathForStorage)) {
            // File does not exist
            file.writeTo(
                this.pathForStorage,
                JSON.stringify({
                    adminGroup: [],
                    userGroup: [],
                }),
            );
        }
        // Load file
        this.permissionFileCache = JSON.parse(file.readFrom(this.pathForStorage));
        return true;
    }

    /**
     * Save Permission File
     * @returns Success status
     */
    private savePermissionFile(): boolean {
        return file.writeTo(this.pathForStorage, JSON.stringify(this.permissionFileCache));
    }

    // ====================================================================================================

    /**
     * Initialize Public Group
     * @returns Success status
     */
    private initializePublicGroup(): boolean {
        if (this.isPublicGroupEnabled === false) return false;
        if (this.checkKeyInObject(this.permissionFileCache, "publicGroup")) return false;
        this.permissionFileCache["publicGroup"] = {
            authority: [],
        };
        return this.savePermissionFile();
    }

    //! Admin Interface

    /**
     * Get All Admins
     * @returns All admins
     */
    retrieveAllAdmins() {
        return this.permissionFileCache.adminGroup;
    }

    /**
     * Check if User is Admin
     * @param xuid User xuid
     * @returns Admin status
     */
    checkIfAdmin(xuid: string): boolean {
        return this.permissionFileCache.adminGroup.indexOf(xuid) !== -1;
    }

    /**
     * Add an Admin
     * @param xuid User xuid
     * @returns Success status
     */
    addAdminUser(xuid: string): boolean {
        if (this.checkIfAdmin(xuid)) return false;
        this.permissionFileCache.adminGroup.push(xuid);
        return this.savePermissionFile();
    }

    /**
     * Remove an Admin
     * @param xuid User xuid
     * @returns Success status
     */
    removeAdminUser(xuid: string): boolean {
        if (!this.checkIfAdmin(xuid)) return false;
        const { adminGroup } = this.permissionFileCache;
        this.permissionFileCache.adminGroup.splice(
            adminGroup.findIndex((xuids) => xuids === xuid),
            1,
        );
        return this.savePermissionFile();
    }

    //! User Group Interface

    /**
     * Check Name Validity (Allows 1-16 bytes, allows Chinese letters, numbers, underscores)
     * @param name Name
     * @returns Validity
     */
    private validateName(name: string): boolean {
        return RegExp(/^[a-zA-Z0-9_\u4e00-\u9fa5]{1,16}$/g).test(name);
    }

    /**
     * Check if Group Exists
     * @param name Permission Group Name
     * @returns Existence
     */
    checkGroupExistence(name: string): boolean {
        return this.permissionFileCache.userGroup.some((i) => i.groupName === name);
    }

    /**
     * Get Group
     * @param name Group Name
     * @returns Group
     */
    retrieveGroup(name: string): GetGroupType | null {
        if (!this.checkGroupExistence(name)) return null;
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
     * Get All Groups
     * @returns User Group List
     */
    retrieveAllGroups(): Array<UserGroupElements> {
        return this.permissionFileCache.userGroup;
    }

    /**
     * Create Group
     * @param name Group Name
     * @returns Success status
     */
    createNewGroup(name: string): boolean {
        if (this.checkGroupExistence(name)) return false;
        if (!this.validateName(name)) return false;
        this.permissionFileCache.userGroup.push({
            groupName: name,
            authority: [],
            user: [],
        });
        return this.savePermissionFile();
    }

    /**
     * Delete Group
     * @param name Group Name
     * @returns Success status
     */
    deleteExistingGroup(name: string): boolean {
        if (!this.checkGroupExistence(name)) return false;
        const { index } = this.retrieveGroup(name);
        this.permissionFileCache.userGroup.splice(index, 1);
        return this.savePermissionFile();
    }

    /**
     * Rename Group
     * @param name Group Name
     * @param newGroupName New Group Name
     * @returns Success status
     */
    renameExistingGroup(name: string, newGroupName: string): boolean {
        if (!this.checkGroupExistence(name)) return false;
        if (!this.validateName(newGroupName)) return false;
        const { index } = this.retrieveGroup(name);
        this.permissionFileCache.userGroup[index].groupName = newGroupName;
        return this.savePermissionFile();
    }

    /**
     * Check if Group has Specific Permissions
     * @param name Group Name
     * @param authority Permission
     * @returns Ownership
     */
    checkGroupPermission(name: string, authority: string): boolean {
        if (!this.checkGroupExistence(name)) return false;
        const group = this.retrieveGroup(name);
        if (group === null) return false;
        return group.group.authority.some((i) => i === authority);
    }

    /**
     * Add Permissions to Group
     * @param name Group Name
     * @param authority Permission
     * @returns Success status
     */
    addGroupPermissions(name: string, authority: string): boolean {
        if (!this.checkGroupExistence(name)) return false; // Group does not exist
        if (!this.validatePermission(authority)) return false; // Permission is not valid
        if (this.checkGroupPermission(name, authority)) return false; // Permission already added
        const { index } = this.retrieveGroup(name);
        this.permissionFileCache.userGroup[index].authority.push(authority);
        return this.savePermissionFile();
    }

    /**
     * Remove Permissions from Group
     * @param name Group Name
     * @param authority Permission
     * @returns Success status
     */
    removeGroupPermissions(name: string, authority: string): boolean {
        if (!this.checkGroupExistence(name)) return false;
        if (!this.checkGroupPermission(name, authority)) return false;
        const { index, group } = this.retrieveGroup(name);
        this.permissionFileCache.userGroup[index].authority.splice(
            group.authority.findIndex((i) => i === authority),
            1,
        );
        return this.savePermissionFile();
    }

    /**
     * Check if Group has Specific Users
     * @param name Group Name
     * @param xuid User xuid
     * @returns Ownership
     */
    checkGroupUser(name: string, xuid: string): boolean {
        if (!this.checkGroupExistence(name)) return false;
        const group = this.retrieveGroup(name);
        if (group === null) return false;
        return group.group.user.some((i) => i === xuid);
    }

    /**
     * Add User to Group
     * @param name Group Name
     * @param xuid User xuid
     * @returns Success status
     */
    addUserToGroup(name: string, xuid: string): boolean {
        if (!this.checkGroupExistence(name)) return false;
        if (this.checkGroupUser(name, xuid)) return false;
        const { index } = this.retrieveGroup(name);
        this.permissionFileCache.userGroup[index].user.push(xuid);
        return this.savePermissionFile();
    }

    /**
     * Remove User from Group
     * @param name Group Name
     * @param xuid User xuid
     * @returns Success status
     */
    removeUserFromGroup(name: string, xuid: string): boolean {
        if (!this.checkGroupExistence(name)) return false;
        if (!this.checkGroupUser(name, xuid)) return false;
        const { index, group } = this.retrieveGroup(name);
        this.permissionFileCache.userGroup[index].user.splice(
            group.user.findIndex((i) => i === xuid),
            1,
        );
        return this.savePermissionFile();
    }

    /**
     * Get Groups with User
     * @param xuid User xuid
     * @returns Group
     */
    retrieveUserGroups(xuid: string): Array<UserGroupElements> {
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
     * Get User Permissions
     * @param xuid User xuid
     * @returns Permissions
     */
    retrieveUserPermissions(xuid: string): GetUserPermissionsType {
        const data: GetUserPermissionsType = {
            authority: [],
            source: {},
        };
        const group = this.retrieveUserGroups(xuid); // Get Groups with User
        for (let i = 0; i < group.length; i++) {
            if (group[i].authority.length === 0) continue; // Group has no permissions, skip

            group[i].authority.forEach((perm) => {
                if (!data.authority.some((data_perm) => data_perm === perm)) {
                    // Group's permission has not been added to return cache
                    data.authority.push(perm); // Add to all permissions
                }

                if (!this.checkKeyInObject(data.source, perm)) {
                    data.source[perm] = []; // Initialize source[]
                }

                if (!data.source[perm].some((source_array_groupName) => source_array_groupName === group[i].groupName)) {
                    data.source[perm].push(group[i].groupName); // Add source Group Name to array
                }
            });
        }
        return data;
    }

    //! Public Group Interface

    /**
     * Get Public Group Permissions
     * @returns Permissions
     */
    retrievePublicGroupPermissions(): Array<string> {
        return this.permissionFileCache.publicGroup.authority;
    }

    /**
     * Check if Public Group has Specific Permissions
     * @param authority Permission
     * @returns Ownership
     */
    checkPublicGroupPermission(authority: string): boolean {
        return this.retrievePublicGroupPermissions().some((p) => p === authority);
    }

    /**
     * Add Permissions to Public Group
     * @param authority Permission
     * @returns Success status
     */
    addPublicGroupPermissions(authority: string): boolean {
        if (!this.validatePermission(authority)) return false;
        if (this.checkPublicGroupPermission(authority)) return false;
        this.permissionFileCache.publicGroup.authority.push(authority);
        return this.savePermissionFile();
    }

    /**
     * Remove Permissions from Public Group
     * @param authority Permission
     * @returns Success status
     */
    removePublicGroupPermissions(authority: string): boolean {
        if (!this.checkPublicGroupPermission(authority)) return false;
        this.permissionFileCache.publicGroup.authority.splice(
            this.permissionFileCache.publicGroup.authority.findIndex((p) => p === authority),
            1,
        );
        return this.savePermissionFile();
    }

    //! Other Interface
    /**
     * Check if User has Specific Permissions
     * @param xuid User xuid
     * @param authority Permission
     * @param publicGroup Check Permissions in Public Group
     * @returns Permission status
     */
    verifyUserPermission(xuid: string, authority: string, publicGroup: boolean = this.isPublicGroupEnabled) {
        if (this.retrieveUserPermissions(xuid).authority.some((p) => p === authority)) {
            return true;
        }
        return publicGroup && this.isPublicGroupEnabled ? this.checkPublicGroupPermission(authority) : false;
    }

    //! Permission Registration Interface

    /**
     * Check if Permission is Valid (6~12 characters, allows numbers, letters)
     * @param authority Permission
     * @returns Validity
     */
    private validatePermission(authority: string): boolean {
        return RegExp(/^[a-zA-Z0-9]{6,12}$/g).test(authority);
    }

    /** All Registered Permissions */
    private registeredPermissions: Array<RegPermissionElement> = [];

    /**
     * Get All Registered Permissions
     * @returns Permission List
     */
    retrieveAllPermissions(): Array<RegPermissionElement> {
        return this.registeredPermissions;
    }

    /**
     * Get a Permission
     * @param value Permission Value
     * @returns Permission Object
     */
    retrievePermission(value: string): RegPermissionElement | null {
        const index = this.registeredPermissions.findIndex((i) => i.value === value);
        return index !== -1 ? this.registeredPermissions[index] : null;
    }

    /**
     * Check if Permission is Registered
     * @param authority Permission
     * @returns Registration status
     */
    checkPermissionRegistration(authority: string): boolean {
        return this.registeredPermissions.some((i) => i.value === authority);
    }

    /**
     * Register Permission
     * @param name Permission Name
     * @param authority Permission Value
     * @returns Success status
     */
    registerPermission(name: string, authority: string): boolean {
        if (!this.validateName(name)) return false; // Name is not valid
        if (!this.validatePermission(authority)) return false; // Permission value is not valid
        if (this.checkPermissionRegistration(authority)) return false; // Permission value is already registered
        this.registeredPermissions.push({
            name: name,
            value: authority,
        });
        return true;
    }

    /**
     * Unregister Permission
     * @param authority Permission
     * @returns Success status
     */
    unregisterPermission(authority: string): boolean {
        if (!this.checkPermissionRegistration(authority)) return false;
        this.registeredPermissions.splice(
            this.registeredPermissions.findIndex((i) => i.value === authority),
            1,
        );
        return true;
    }
}
