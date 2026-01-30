/**
 * IDEN-FRAMEWORK PERMISSIONS MODULE
 * Sistema genérico de roles e permissões
 */

const PermissionsManager = {
    roles: {
        ADMIN: 'administrador',
        USER: 'usuario',
        GUEST: 'visitante'
    },

    presets: {
        'administrador': ['*'],
        'usuario': ['view_dashboard', 'view_profile'],
        'visitante': ['view_dashboard']
    },

    can(user, permission) {
        if (!user || !user.role) return false;
        const userRole = user.role.toLowerCase();
        const userPermissions = this.presets[userRole] || [];
        
        if (userPermissions.includes('*')) return true;
        return userPermissions.includes(permission);
    },

    getRoleLabel(role) {
        const labels = {
            'administrador': 'Administrador',
            'usuario': 'Usuário Padrão',
            'visitante': 'Visitante'
        };
        return labels[role.toLowerCase()] || role;
    }
};

window.IDEN_Permissions = PermissionsManager;
