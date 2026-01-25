// ===================================================================================
//  MÓDULO DE VALIDAÇÕES E FORMATAÇÕES
//  Funções utilitárias para validação de campos, máscaras e formatação de dados
// ===================================================================================

const Validators = {
    cleanName: (v) => v.toUpperCase().replace(/[^A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]/g, ''),
    
    cleanNumber: (v) => v.replace(/\D/g, ''),
    
    cleanAlphaNum: (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, ''),
    
    validatePlate: (v) => {
        // Remove tudo que não for alfanumérico
        const clean = v.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        // Limita a 7 caracteres
        const limited = clean.substring(0, 7);
        
        // Formatação visual (AAA-1234 ou AAA1A23)
        // Se for padrão antigo (3 letras + 4 números), coloca hífen
        // Se for Mercosul (3 letras + 1 número + 1 letra + 2 números), mantém sem hífen ou formata específico
        // O usuário pediu validação: "btt1234 e btt1d23 sao validos"
        
        // Regex de validação estrita para feedback visual (opcional) ou apenas formatação
        // Aqui apenas retornamos o valor limpo ou formatado com hífen se parecer antigo
        
        if (limited.length >= 3) {
            // Se os 4 últimos forem números, sugere hífen
            const part1 = limited.substring(0, 3);
            const part2 = limited.substring(3);
            
            // Verifica se a parte 2 começa com número
            if (part2.length > 0 && /^\d/.test(part2)) {
                 // Se o 5º caractere (índice 4 da string completa, índice 1 de part2) for número -> Antiga
                 // Se for letra -> Mercosul
                 if (part2.length >= 2) {
                     const fifthChar = part2[1];
                     if (!isNaN(fifthChar)) {
                         // Padrão antigo: AAA-1234
                         return part1 + '-' + part2;
                     }
                 } else if (part2.length === 1) {
                     // Digitando o 4º caractere (número)
                     return part1 + '-' + part2;
                 }
            }
        }
        
        // Se não se encaixar na formatação com hífen, retorna limpo (Mercosul geralmente não usa hífen ou usa visualmente)
        // Mas para simplificar e atender o "btt1234" (com hífen?) o usuário deu exemplo sem hífen "btt1234"
        // Vamos retornar sem hífen se for Mercosul, com hífen se for antigo, ou apenas limpo se o usuário preferir
        // O código anterior colocava hífen sempre que len >= 7.
        
        // Vamos manter simples: retornar com hífen se parecer antigo, sem se for Mercosul.
        // Regex Antiga: ^[A-Z]{3}[0-9]{4}$
        // Regex Mercosul: ^[A-Z]{3}[0-9][A-Z][0-9]{2}$
        
        if (limited.length === 7) {
            if (/^[A-Z]{3}[0-9]{4}$/.test(limited)) {
                return limited.substring(0, 3) + '-' + limited.substring(3);
            }
        }
        
        return limited;
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
