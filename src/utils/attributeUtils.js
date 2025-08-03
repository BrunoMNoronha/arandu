// Funções de conversão de atributos para valores de status
// Recebem um objeto de atributos { FOR, AGI, VIT, INT, DES, SOR }

export function calcPhysicalAttack(attrs) {
    const { FOR = 0, AGI = 0 } = attrs;
    return FOR * 2 + AGI;
}

export function calcMaxHp(attrs) {
    const { VIT = 0 } = attrs;
    return 50 + VIT * 10;
}

// Calcula velocidade de movimento com base na Agilidade
export function calcMoveSpeed(attrs, baseSpeed = 0) {
    const { AGI = 0 } = attrs;
    return baseSpeed + AGI * 2;
}

// Calcula cooldown de ataque reduzindo conforme a Destreza
export function calcAttackCooldown(attrs, baseCooldown = 0) {
    const { DES = 0 } = attrs;
    const reduced = baseCooldown - DES * 5;
    return Math.max(100, reduced);
}
