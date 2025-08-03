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
