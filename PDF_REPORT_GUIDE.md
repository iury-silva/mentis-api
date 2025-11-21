# 📄 Guia do Relatório PDF - Mentis

## 🎯 Endpoint Implementado

```
GET /mood-record/report/pdf
```

**Autenticação**: Bearer Token (JWT)

---

## 🚀 Como Usar

### 1. **Via cURL:**

```bash
curl -X GET "http://localhost:3000/mood-record/report/pdf" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  --output relatorio-mentis.pdf
```

### 2. **Via Frontend (React/TypeScript):**

```typescript
// Service
export const moodRecordService = {
  async downloadPdfReport() {
    const response = await api.get('/mood-record/report/pdf', {
      responseType: 'blob', // IMPORTANTE!
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    // Criar URL do blob
    const url = window.URL.createObjectURL(new Blob([response.data]));

    // Criar link temporário
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `relatorio-mentis-${new Date().toISOString().split('T')[0]}.pdf`,
    );

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
```

### 3. **Componente React:**

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { moodRecordService } from '@/services/mood-record.service';
import toast from 'react-hot-toast';

export const DownloadReportButton = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await moodRecordService.downloadPdfReport();
      toast.success('Relatório baixado com sucesso!');
    } catch (error) {
      toast.error('Erro ao baixar relatório');
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      size="lg"
      className="w-full"
    >
      {isDownloading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Gerando PDF...
        </>
      ) : (
        <>
          <Download className="w-5 h-5 mr-2" />
          Baixar Relatório Completo
        </>
      )}
    </Button>
  );
};
```

---

## 📊 O que o Relatório Contém?

### **1. Cabeçalho**

- Logo da Mentis
- Data de geração
- Título do relatório

### **2. Dados do Usuário**

- Nome completo
- Email
- Total de registros
- Sequência de dias consecutivos 🔥

### **3. Estatísticas Gerais (Últimos 30 dias)**

Cards com:

- 😊 Humor Médio
- 😰 Ansiedade Média
- ⚡ Energia Média
- 💤 Qualidade do Sono
- 😓 Nível de Estresse
- 🎯 Bem-Estar Geral (calculado)

**Cores dinâmicas baseadas nos scores:**

- 🟢 Verde: Score >= 4 (Ótimo)
- 🔵 Azul: Score >= 3 (Bom)
- 🟡 Amarelo: Score >= 2 (Neutro)
- 🔴 Vermelho: Score < 2 (Precisa atenção)

### **4. Tendências Recentes**

Box destacado com:

- Evolução do humor
- Evolução da ansiedade
- Evolução do estresse
- Indicadores visuais (↑ ↓ →)

### **5. Histórico Detalhado**

Tabela com os **últimos 10 registros**:

- Data
- Todos os scores (com badges coloridos)
- Insights da IA (quando disponível)

### **6. Rodapé**

- Aviso de confidencialidade
- Copyright

---

## 🎨 Design do PDF

✅ **Totalmente estilizado com:**

- Font Inter (moderna e legível)
- Gradientes e cores da identidade visual
- Cards e badges coloridos
- Layout responsivo A4
- Background printing habilitado
- Margens adequadas

✅ **Código de cores:**

- Primary: `#6366f1` (Indigo)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)

---

## 🛠️ Tecnologias Utilizadas

- **Puppeteer**: Geração do PDF
- **HTML/CSS**: Layout estilizado
- **Google Fonts**: Tipografia Inter
- **NestJS**: Backend API
- **Prisma**: Consulta de dados

---

## 📝 Exemplo de Response Headers

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="relatorio-mentis-joao-silva-2025-11-16.pdf"
Content-Length: 245678
```

---

## 🚨 Troubleshooting

### **Problema: PDF não baixa no navegador**

**Solução**: Certifique-se de usar `responseType: 'blob'` no axios

### **Problema: Puppeteer erro no servidor**

**Solução**: Adicione essas flags no launch:

```typescript
args: ['--no-sandbox', '--disable-setuid-sandbox'];
```

### **Problema: Fontes não aparecem no PDF**

**Solução**: As fontes são carregadas via Google Fonts CDN, certifique-se que o servidor tem acesso à internet

---

## 🎯 Próximos Passos (Opcional)

### **Melhorias sugeridas:**

1. **Gráficos Visuais**
   - Adicionar Chart.js para gráficos de linha
   - Timeline visual do humor

2. **Personalização**
   - Permitir escolher período (7, 30, 90 dias)
   - Filtros por métrica específica

3. **Compartilhamento**
   - Gerar link temporário
   - Enviar por email

4. **Cache**
   - Cachear PDFs por 1 hora
   - Regenerar apenas se houver novos dados

---

## ✅ Checklist de Implementação

- [x] Instalar Puppeteer
- [x] Criar método `generatePdfReport` no service
- [x] Criar método auxiliar `generateReportHTML`
- [x] Adicionar endpoint GET `/mood-record/report/pdf`
- [x] Implementar headers corretos
- [x] Estilizar PDF com CSS
- [ ] Testar endpoint com usuário autenticado
- [ ] Implementar botão no frontend
- [ ] Deploy em produção

---

## 📞 Suporte

Se tiver qualquer dúvida ou problema, consulte:

- Logs do servidor: `console.log` no método
- Erros do Puppeteer: Verifique permissões
- Network tab do navegador: Verifique response

---

**Desenvolvido com ❤️ para Mentis**
