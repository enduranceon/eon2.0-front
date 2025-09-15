import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import { User, UserType } from '../types/api';
import { enduranceApi } from './enduranceApi';

export interface ExportData {
  students: User[];
  filters?: {
    searchTerm?: string;
    age?: string;
    selectedCoach?: string;
    selectedModality?: string;
    selectedPlan?: string;
  };
}

export interface ExportFilters {
  searchTerm?: string;
  age?: string;
  selectedCoach?: string;
  selectedModality?: string;
  selectedPlan?: string;
}

export class ExportService {
  /**
   * Busca todos os alunos usando paginação
   */
  static async getAllStudents(filters: ExportFilters = {}): Promise<User[]> {
    const allStudents: User[] = [];
    let page = 1;
    let hasNext = true;
    const limit = 100; // Buscar em lotes de 100 para melhor performance

    while (hasNext) {
      try {
        const apiFilters: any = { 
          userType: UserType.FITNESS_STUDENT, 
          page, 
          limit 
        };
        
        if (filters.searchTerm) apiFilters.search = filters.searchTerm;
        if (filters.age) apiFilters.age = parseInt(filters.age, 10);
        if (filters.selectedCoach) apiFilters.coachId = filters.selectedCoach;
        if (filters.selectedModality) apiFilters.modalidadeId = filters.selectedModality;
        if (filters.selectedPlan) apiFilters.planId = filters.selectedPlan;
        
        const response = await enduranceApi.getUsers(apiFilters);
        
        if (response.data && Array.isArray(response.data)) {
          allStudents.push(...response.data);
        }
        
        // Verificar se há próxima página
        hasNext = response.pagination?.hasNext || false;
        page++;
        
        // Limite de segurança para evitar loops infinitos
        if (page > 100) {
          console.warn('Limite de páginas atingido (100). Interrompendo busca.');
          break;
        }
      } catch (error) {
        console.error(`Erro ao buscar página ${page}:`, error);
        break;
      }
    }

    return allStudents;
  }

  /**
   * Exporta a lista de estudantes para PDF
   */
  static async exportToPDF(data: ExportData): Promise<void> {
    const { students, filters } = data;
    
    // Criar documento PDF
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape para melhor visualização da tabela
    
    // Configurar fonte
    doc.setFont('helvetica');
    
    // Título
    doc.setFontSize(20);
    doc.text('Lista de Alunos', 20, 20);
    
    // Data de exportação
    doc.setFontSize(10);
    doc.text(`Exportado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
    
    // Filtros aplicados (se houver)
    let yPosition = 40;
    if (filters && Object.values(filters).some(value => value && value !== '')) {
      doc.setFontSize(12);
      doc.text('Filtros aplicados:', 20, yPosition);
      
      yPosition = 50;
      doc.setFontSize(10);
      
      if (filters.searchTerm) {
        doc.text(`• Busca: ${filters.searchTerm}`, 20, yPosition);
        yPosition += 5;
      }
      if (filters.age) {
        doc.text(`• Idade: ${filters.age} anos`, 20, yPosition);
        yPosition += 5;
      }
      if (filters.selectedCoach) {
        doc.text(`• Treinador: ${filters.selectedCoach}`, 20, yPosition);
        yPosition += 5;
      }
      if (filters.selectedModality) {
        doc.text(`• Modalidade: ${filters.selectedModality}`, 20, yPosition);
        yPosition += 5;
      }
      if (filters.selectedPlan) {
        doc.text(`• Plano: ${filters.selectedPlan}`, 20, yPosition);
        yPosition += 5;
      }
      
      yPosition += 10;
    }
    
    // Título da primeira tabela
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Dados Principais dos Alunos', 20, yPosition + 5);
    
    // Cabeçalho da tabela - Primeira página (dados principais)
    const tableHeaders1 = ['Nome', 'Email', 'Telefone', 'CPF/CNPJ', 'Idade', 'Gênero', 'Status'];
    const colWidths1 = [40, 60, 35, 30, 15, 20, 20];
    const startX = 20;
    const startY = yPosition + 15;
    
    // Desenhar cabeçalho da primeira tabela
    doc.setFillColor(240, 240, 240);
    doc.rect(startX, startY, colWidths1.reduce((a, b) => a + b, 0), 8, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    let currentX = startX;
    tableHeaders1.forEach((header, index) => {
      doc.text(header, currentX + 2, startY + 5);
      currentX += colWidths1[index];
    });
    
    // Dados da tabela
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    let currentY = startY + 8;
    const maxRowsPerPage = 15;
    let pageCount = 1;
    
    students.forEach((student, index) => {
      // Verificar se precisa de nova página
      if (index > 0 && index % maxRowsPerPage === 0) {
        doc.addPage();
        pageCount++;
        currentY = 20;
        
        // Redesenhar cabeçalho da primeira tabela na nova página
        doc.setFillColor(240, 240, 240);
        doc.rect(startX, currentY, colWidths1.reduce((a, b) => a + b, 0), 8, 'F');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        currentX = startX;
        tableHeaders1.forEach((header, headerIndex) => {
          doc.text(header, currentX + 2, currentY + 5);
          currentX += colWidths1[headerIndex];
        });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        currentY += 8;
      }
      
      // Calcular idade
      const age = this.calculateAge(student.birthDate);
      
      // Dados da linha - Primeira tabela (dados principais)
      const rowData1 = [
        student.name || 'N/A',
        student.email || 'N/A',
        student.phone || 'N/A',
        student.cpfCnpj || 'N/A',
        age ? age.toString() : 'N/A',
        student.gender ? (student.gender === 'MALE' ? 'Masculino' : student.gender === 'FEMALE' ? 'Feminino' : student.gender) : 'N/A',
        student.isActive ? 'Ativo' : 'Inativo'
      ];
      
      // Desenhar linha da primeira tabela
      currentX = startX;
      rowData1.forEach((cellData, cellIndex) => {
        // Truncar texto se muito longo
        const maxLength = Math.floor(colWidths1[cellIndex] / 2);
        const displayText = cellData.length > maxLength 
          ? cellData.substring(0, maxLength - 3) + '...' 
          : cellData;
        
        doc.text(displayText, currentX + 2, currentY + 5);
        currentX += colWidths1[cellIndex];
      });
      
      currentY += 6;
    });
    
    // Adicionar segunda tabela com dados adicionais
    const additionalDataY = currentY + 20;
    
    // Título da segunda tabela
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Dados Adicionais dos Alunos', 20, additionalDataY);
    
    // Cabeçalho da segunda tabela
    const tableHeaders2 = ['Nome', 'Plano', 'Modalidade', 'Periodicidade', 'Endereço'];
    const colWidths2 = [50, 50, 40, 30, 80];
    const startY2 = additionalDataY + 10;
    
    // Desenhar cabeçalho da segunda tabela
    doc.setFillColor(240, 240, 240);
    doc.rect(startX, startY2, colWidths2.reduce((a, b) => a + b, 0), 8, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    currentX = startX;
    tableHeaders2.forEach((header, index) => {
      doc.text(header, currentX + 2, startY2 + 5);
      currentX += colWidths2[index];
    });
    
    // Dados da segunda tabela
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    let currentY2 = startY2 + 8;
    
    students.forEach((student, index) => {
      // Verificar se precisa de nova página para segunda tabela
      if (index > 0 && index % maxRowsPerPage === 0) {
        doc.addPage();
        pageCount++;
        currentY2 = 20;
        
        // Redesenhar cabeçalho da segunda tabela na nova página
        doc.setFillColor(240, 240, 240);
        doc.rect(startX, currentY2, colWidths2.reduce((a, b) => a + b, 0), 8, 'F');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        currentX = startX;
        tableHeaders2.forEach((header, headerIndex) => {
          doc.text(header, currentX + 2, currentY2 + 5);
          currentX += colWidths2[headerIndex];
        });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        currentY2 += 8;
      }
      
      const age = this.calculateAge(student.birthDate);
      
      // Dados da linha da segunda tabela
      const address = student.addresses && student.addresses.length > 0 && student.addresses[0]
        ? `${student.addresses[0].street || ''}, ${student.addresses[0].number || ''}, ${student.addresses[0].neighborhood || ''}, ${student.addresses[0].city || ''}, ${student.addresses[0].state || ''}`.replace(/^,\s*|,\s*$/g, '')
        : 'N/A';

      const period = student.subscriptions && student.subscriptions.length > 0 && student.subscriptions[0].period
        ? this.formatPeriod(student.subscriptions[0].period)
        : 'N/A';

      const rowData2 = [
        student.name || 'N/A',
        student.subscriptions && student.subscriptions.length > 0 && student.subscriptions[0].plan
          ? student.subscriptions[0].plan.name 
          : 'N/A',
        student.subscriptions && student.subscriptions.length > 0 && student.subscriptions[0].modalidade
          ? student.subscriptions[0].modalidade.name 
          : 'N/A',
        period,
        address
      ];
      
      // Desenhar linha da segunda tabela
      currentX = startX;
      rowData2.forEach((cellData, cellIndex) => {
        // Truncar texto se muito longo
        const maxLength = Math.floor(colWidths2[cellIndex] / 2);
        const displayText = cellData.length > maxLength 
          ? cellData.substring(0, maxLength - 3) + '...' 
          : cellData;
        
        doc.text(displayText, currentX + 2, currentY2 + 5);
        currentX += colWidths2[cellIndex];
      });
      
      currentY2 += 6;
    });
    
    // Rodapé com total de registros
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Total de alunos: ${students.length}`, 20, doc.internal.pageSize.height - 10);
      doc.text(`Página ${i} de ${totalPages}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
    }
    
    // Salvar arquivo
    const fileName = `alunos_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
  
  /**
   * Exporta a lista de estudantes para CSV
   */
  static exportToCSV(data: ExportData): void {
    const { students, filters } = data;
    
    // Preparar dados para CSV
    const csvData = students.map(student => {
      const age = this.calculateAge(student.birthDate);
      
      const address = student.addresses && student.addresses.length > 0 && student.addresses[0]
        ? `${student.addresses[0].street || ''}, ${student.addresses[0].number || ''}, ${student.addresses[0].complement || ''}, ${student.addresses[0].neighborhood || ''}, ${student.addresses[0].city || ''}, ${student.addresses[0].state || ''}, ${student.addresses[0].zipCode || ''}`.replace(/^,\s*|,\s*$/g, '')
        : 'N/A';

      const period = student.subscriptions && student.subscriptions.length > 0 && student.subscriptions[0].period
        ? this.formatPeriod(student.subscriptions[0].period)
        : 'N/A';
      
      return {
        'Nome': student.name || 'N/A',
        'Email': student.email || 'N/A',
        'Telefone': student.phone || 'N/A',
        'CPF/CNPJ': student.cpfCnpj || 'N/A',
        'Data de Nascimento': student.birthDate ? new Date(student.birthDate).toLocaleDateString('pt-BR') : 'N/A',
        'Idade': age ? age.toString() : 'N/A',
        'Gênero': student.gender ? (student.gender === 'MALE' ? 'Masculino' : student.gender === 'FEMALE' ? 'Feminino' : student.gender) : 'N/A',
        'Status': student.isActive ? 'Ativo' : 'Inativo',
        'Plano': student.subscriptions && student.subscriptions.length > 0 && student.subscriptions[0].plan
          ? student.subscriptions[0].plan.name 
          : 'N/A',
        'Modalidade': student.subscriptions && student.subscriptions.length > 0 && student.subscriptions[0].modalidade
          ? student.subscriptions[0].modalidade.name 
          : 'N/A',
        'Periodicidade': period,
        'Treinador': student.subscriptions && student.subscriptions.length > 0 && student.subscriptions[0].coach
          ? student.subscriptions[0].coach.name 
          : 'N/A',
        'Data de Cadastro': student.createdAt ? new Date(student.createdAt).toLocaleDateString('pt-BR') : 'N/A',
        'Data de Atualização': student.updatedAt ? new Date(student.updatedAt).toLocaleDateString('pt-BR') : 'N/A',
        'Endereço Completo': address,
        'Rua': student.addresses && student.addresses.length > 0 && student.addresses[0] ? student.addresses[0].street || 'N/A' : 'N/A',
        'Número': student.addresses && student.addresses.length > 0 && student.addresses[0] ? student.addresses[0].number || 'N/A' : 'N/A',
        'Complemento': student.addresses && student.addresses.length > 0 && student.addresses[0] ? student.addresses[0].complement || 'N/A' : 'N/A',
        'Bairro': student.addresses && student.addresses.length > 0 && student.addresses[0] ? student.addresses[0].neighborhood || 'N/A' : 'N/A',
        'Cidade': student.addresses && student.addresses.length > 0 && student.addresses[0] ? student.addresses[0].city || 'N/A' : 'N/A',
        'Estado': student.addresses && student.addresses.length > 0 && student.addresses[0] ? student.addresses[0].state || 'N/A' : 'N/A',
        'CEP': student.addresses && student.addresses.length > 0 && student.addresses[0] ? student.addresses[0].zipCode || 'N/A' : 'N/A',
        'Imagem': student.image || 'N/A'
      };
    });
    
    // Converter para CSV
    const csv = Papa.unparse(csvData, {
      header: true,
      delimiter: ';'
    });
    
    // Criar e baixar arquivo
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `alunos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  /**
   * Calcula a idade baseada na data de nascimento
   */
  private static calculateAge(birthDate: string | null): number | null {
    if (!birthDate) return null;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Formata a periodicidade do plano
   */
  private static formatPeriod(period: string | null): string {
    if (!period) return 'N/A';
    
    const periodMap: { [key: string]: string } = {
      'WEEKLY': 'Semanal',
      'BIWEEKLY': 'Quinzenal',
      'MONTHLY': 'Mensal',
      'QUARTERLY': 'Trimestral',
      'SEMIANNUALLY': 'Semestral',
      'YEARLY': 'Anual'
    };
    
    return periodMap[period] || period;
  }
  
  /**
   * Exporta todos os alunos para PDF (busca completa com paginação)
   */
  static async exportAllStudentsToPDF(filters: ExportFilters = {}): Promise<void> {
    try {
      console.log('Buscando todos os alunos...');
      const allStudents = await this.getAllStudents(filters);
      console.log(`Encontrados ${allStudents.length} alunos`);
      
      const exportData: ExportData = {
        students: allStudents,
        filters
      };
      
      await this.exportToPDF(exportData);
    } catch (error) {
      console.error('Erro ao exportar todos os alunos para PDF:', error);
      throw error;
    }
  }

  /**
   * Exporta todos os alunos para CSV (busca completa com paginação)
   */
  static async exportAllStudentsToCSV(filters: ExportFilters = {}): Promise<void> {
    try {
      console.log('Buscando todos os alunos...');
      const allStudents = await this.getAllStudents(filters);
      console.log(`Encontrados ${allStudents.length} alunos`);
      
      const exportData: ExportData = {
        students: allStudents,
        filters
      };
      
      this.exportToCSV(exportData);
    } catch (error) {
      console.error('Erro ao exportar todos os alunos para CSV:', error);
      throw error;
    }
  }

  /**
   * Exporta dados usando HTML2Canvas (alternativa para PDF mais complexo)
   */
  static async exportTableToPDF(tableElement: HTMLElement, filename: string = 'alunos.pdf'): Promise<void> {
    try {
      const canvas = await html2canvas(tableElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      const imgWidth = 297; // A4 width in mm
      const pageHeight = 210; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(filename);
    } catch (error) {
      console.error('Erro ao exportar tabela para PDF:', error);
      throw new Error('Não foi possível exportar a tabela para PDF');
    }
  }
}
