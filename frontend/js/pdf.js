/* Módulo de impressão/PDF. Mantém a impressão nativa e prepara metadados do documento. */
App.PDF={print(){document.body.dataset.printedAt=new Date().toISOString();window.print();}};
