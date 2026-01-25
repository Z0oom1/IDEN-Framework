// ===================================================================================
//  MÓDULO DE VALIDAÇÕES E FORMATAÇÕES
//  Funções utilitárias para validação de campos, máscaras e formatação de dados
// ===================================================================================

const Validators = {
    cleanName: (v) => v.toUpperCase().replace(/[^A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]/g, ''),
    
    cleanNumber: (v) => v.replace(/\D/g, ''),
    
    cleanAlphaNum: (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, ''),
    
    validatePlate: (v) => {
        const clean = v.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (clean.length >= 7) {
            return clean.substring(0, 3) + '-' + clean.substring(3, 7);
        }
        return clean;
    },
    
    formatCNPJ: (v) => {
        const clean = v.replace(/\D/g, '');
        if (clean.length <= 14) {
            return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
        }
        return v;
    },
    
    formatCPF: (v) => {
        const clean = v.replace(/\D/g, '');
        if (clean.length <= 11) {
            return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
        }
        return v;
    },
    
    onlyNumbers: (v) => v.replace(/\D/g, ''),
    
    onlyLetters: (v) => v.toUpperCase().replace(/[^A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]/g, '')
};

function getBrazilTime() {
    return new Date(Date.now() - 3 * 3600000).toISOString();
}
