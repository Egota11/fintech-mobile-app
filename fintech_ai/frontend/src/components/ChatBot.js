import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  TextField,
  Avatar,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Zoom
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';

// Akıllı AI cevap fonksiyonu - localStorage verilerini kullanarak daha iyi yanıtlar üretir
const smartAIResponse = (message) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // LocalStorage'dan harcama verilerini al
      const savedExpenses = localStorage.getItem('expenses');
      let expenses = [];
      let totalExpenses = 0;
      let categoryTotals = {};
      let categoryExpenses = {};
      
      // Finansal özet verileri - normalde API'den gelecek
      const financialSummary = {
        monthlyIncome: 13500,
        monthlyExpenses: 10000,
        savings: 3500,
        taxDeductible: 7400,
        savingsRate: 26, // yüzde olarak
        previousMonthIncome: 12900,
        previousMonthExpenses: 9700,
        incomeGrowth: 5, // yüzde olarak
        expenseGrowth: 3, // yüzde olarak
        targetSavingsRate: 30, // yüzde olarak
        currentMonth: "Mart 2023",
        previousMonth: "Şubat 2023",
        financialHealth: "İyi", // İyi, Orta, Geliştirilebilir
        budgetStatus: {
          "Market": { limit: 3800, used: 3500, remaining: 300, status: "İyi" },
          "Faturalar": { limit: 2500, used: 2200, remaining: 300, status: "İyi" },
          "Ulaşım": { limit: 2000, used: 1800, remaining: 200, status: "İyi" },
          "Eğlence": { limit: 1800, used: 1500, remaining: 300, status: "İyi" },
          "Sağlık": { limit: 2000, used: 1520, remaining: 480, status: "İyi" }
        },
        investments: {
          total: 65000,
          monthlyReturn: 3.2,
          yearlyReturn: 12.5,
          allocation: {
            "Hisse Senetleri": 45,
            "Tahviller": 30,
            "Altın": 15,
            "Kripto": 10
          }
        },
        goals: [
          { name: "Acil Durum Fonu", target: 40000, current: 35000, progress: 87.5 },
          { name: "Tatil Fonu", target: 15000, current: 8000, progress: 53.3 },
          { name: "Ev Alımı", target: 500000, current: 120000, progress: 24 }
        ]
      };
      
      if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
        
        // Toplam harcamaları hesapla
        totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);
        
        // Kategori bazlı toplam harcamaları hesapla
        expenses.forEach(expense => {
          if (categoryTotals[expense.category]) {
            categoryTotals[expense.category] += expense.amount;
            categoryExpenses[expense.category].push(expense);
          } else {
            categoryTotals[expense.category] = expense.amount;
            categoryExpenses[expense.category] = [expense];
          }
        });
      }
      
      // Vergi indirimine tabi harcamaları bul
      const taxDeductibleExpenses = expenses.filter(exp => exp.is_tax_deductible);
      const totalTaxDeductible = taxDeductibleExpenses.reduce((total, expense) => total + expense.amount, 0);
      
      // Kategori bazlı sorulara cevap ver
      const lowercaseMessage = message.toLowerCase();
      
      // Aylık gelir sorguları
      if ((lowercaseMessage.includes('aylık') || lowercaseMessage.includes('ay')) && 
          (lowercaseMessage.includes('gelir') || lowercaseMessage.includes('kazanç') || lowercaseMessage.includes('maaş'))) {
        const incomeGrowthText = financialSummary.incomeGrowth > 0 
          ? `Bu, ${financialSummary.previousMonth} ayına göre %${financialSummary.incomeGrowth} artış gösteriyor.` 
          : financialSummary.incomeGrowth < 0 
            ? `Bu, ${financialSummary.previousMonth} ayına göre %${Math.abs(financialSummary.incomeGrowth)} azalış gösteriyor.`
            : `Bu, ${financialSummary.previousMonth} ayı ile aynı seviyede.`;
        
        resolve(`${financialSummary.currentMonth} ayı toplam geliriniz ${financialSummary.monthlyIncome.toLocaleString('tr-TR')} ₺. ${incomeGrowthText} Gelirinizi "Gelirler" sayfasından detaylı olarak görüntüleyebilir ve yönetebilirsiniz.`);
        return;
      }
      
      // Aylık gider sorguları
      if ((lowercaseMessage.includes('aylık') || lowercaseMessage.includes('ay')) && 
          (lowercaseMessage.includes('gider') || lowercaseMessage.includes('harcama'))) {
        
        // En çok harcama yapılan kategoriyi bul
        let maxCategory = '';
        let maxAmount = 0;
        
        Object.entries(categoryTotals).forEach(([category, amount]) => {
          if (amount > maxAmount) {
            maxCategory = category;
            maxAmount = amount;
          }
        });
        
        const expenseGrowthText = financialSummary.expenseGrowth > 0 
          ? `Bu, ${financialSummary.previousMonth} ayına göre %${financialSummary.expenseGrowth} artış gösteriyor.` 
          : financialSummary.expenseGrowth < 0 
            ? `Bu, ${financialSummary.previousMonth} ayına göre %${Math.abs(financialSummary.expenseGrowth)} azalış gösteriyor.`
            : `Bu, ${financialSummary.previousMonth} ayı ile aynı seviyede.`;
        
        resolve(`${financialSummary.currentMonth} ayı toplam harcamanız ${financialSummary.monthlyExpenses.toLocaleString('tr-TR')} ₺. ${expenseGrowthText} 
En çok harcama yaptığınız kategori "${maxCategory}" (${maxAmount.toLocaleString('tr-TR')} ₺). Harcamalarınızı "Harcamalar" sayfasından detaylı olarak görüntüleyebilir ve yönetebilirsiniz.`);
        return;
      }
      
      // Tasarruf ve tasarruf oranı sorguları
      if (lowercaseMessage.includes('tasarruf') || lowercaseMessage.includes('birikim')) {
        const savingsStatus = financialSummary.savingsRate >= financialSummary.targetSavingsRate 
          ? "Bu, hedeflediğiniz tasarruf oranının üzerinde. Harika bir iş çıkarıyorsunuz!" 
          : `Bu, %${financialSummary.targetSavingsRate} olan hedef tasarruf oranınızın altında. Harcamalarınızı azaltarak veya gelirinizi artırarak tasarruf oranınızı yükseltebilirsiniz.`;
        
        resolve(`${financialSummary.currentMonth} ayı tasarrufunuz ${financialSummary.savings.toLocaleString('tr-TR')} ₺, bu da aylık gelirinizin %${financialSummary.savingsRate}'sini oluşturuyor. ${savingsStatus}`);
        return;
      }
      
      // Finansal sağlık durumu 
      if (lowercaseMessage.includes('finansal') && 
          (lowercaseMessage.includes('sağlık') || lowercaseMessage.includes('durum'))) {
        
        let suggestions = '';
        if (financialSummary.financialHealth === "İyi") {
          suggestions = "Mevcut stratejinizi sürdürmeniz ve acil durum fonunuzu güçlendirmeniz önerilir.";
        } else if (financialSummary.financialHealth === "Orta") {
          suggestions = "Harcamalarınızı azaltmanız ve tasarruf oranınızı artırmanız önerilir.";
        } else {
          suggestions = "Bütçe planlamanızı gözden geçirmeniz ve gereksiz harcamalarınızı kısmanız önerilir.";
        }
        
        resolve(`Finansal sağlık durumunuz "${financialSummary.financialHealth}" olarak değerlendirilmektedir. Aylık gelirinizin %${financialSummary.savingsRate}'ini tasarruf ediyorsunuz, hedef oran ise %${financialSummary.targetSavingsRate}. ${suggestions}`);
        return;
      }
      
      // Bütçe durumu sorguları
      if (lowercaseMessage.includes('bütçe') && 
          (lowercaseMessage.includes('durum') || lowercaseMessage.includes('kalan'))) {
        
        let budgetStatusText = '';
        Object.entries(financialSummary.budgetStatus).forEach(([category, data]) => {
          const percentUsed = Math.round((data.used / data.limit) * 100);
          budgetStatusText += `${category}: ${data.used.toLocaleString('tr-TR')} ₺ / ${data.limit.toLocaleString('tr-TR')} ₺ (%${percentUsed}), `;
        });
        
        budgetStatusText = budgetStatusText.slice(0, -2); // Son virgül ve boşluğu kaldır
        
        resolve(`Bütçe durumunuz şu şekildedir:\n${budgetStatusText}\n\nBütçe planlamanızı "Bütçe" sayfasından detaylı olarak görüntüleyebilir ve düzenleyebilirsiniz.`);
        return;
      }
      
      // Bütçe tavsiyesi sorguları
      if (lowercaseMessage.includes('bütçe') && 
          (lowercaseMessage.includes('öneri') || lowercaseMessage.includes('tavsiye'))) {
        
        // Bütçe limitine yaklaşan kategorileri bul
        const highUtilizationCategories = [];
        
        Object.entries(financialSummary.budgetStatus).forEach(([category, data]) => {
          const percentUsed = Math.round((data.used / data.limit) * 100);
          if (percentUsed >= 80) {
            highUtilizationCategories.push(`${category} (%${percentUsed})`);
          }
        });
        
        let adviceText = '';
        if (highUtilizationCategories.length > 0) {
          adviceText = `Şu kategorilerde bütçe limitinize yaklaşıyorsunuz: ${highUtilizationCategories.join(', ')}. Bu alanlardaki harcamalarınızı azaltmanız önerilir.`;
        } else {
          adviceText = "Tüm kategorilerde bütçe limitinizin altındasınız. İyi bir mali yönetim gösteriyorsunuz!";
        }
        
        resolve(`${adviceText} Gelecek ay için tasarruf hedefinizi %${financialSummary.targetSavingsRate + 5} olarak belirleyerek daha hızlı finansal hedeflerinize ulaşabilirsiniz.`);
        return;
      }
      
      // Sağlık harcamaları sorguları
      if (lowercaseMessage.includes('sağlık') && lowercaseMessage.includes('harcama')) {
        const healthExpenses = categoryExpenses['Sağlık'] || [];
        const totalHealthExpenses = categoryTotals['Sağlık'] || 0;
        
        if (healthExpenses.length > 0) {
          const taxDeductibleHealth = healthExpenses.filter(exp => exp.is_tax_deductible);
          const taxDeductibleHealthTotal = taxDeductibleHealth.reduce((total, exp) => total + exp.amount, 0);
          
          const lastExpenseDate = new Date(healthExpenses[healthExpenses.length-1]?.date || new Date()).toLocaleDateString('tr-TR');
          const lastExpenseAmount = healthExpenses[healthExpenses.length-1]?.amount?.toLocaleString('tr-TR') || 0;
          
          resolve(`Bu yıl toplam ${totalHealthExpenses.toLocaleString('tr-TR')} ₺ sağlık harcaması yapmışsınız. Bunların ${taxDeductibleHealthTotal.toLocaleString('tr-TR')} ₺ tutarındaki kısmı vergi indirimine tabi. Son sağlık harcamanız ${lastExpenseDate} tarihinde ${lastExpenseAmount} ₺ tutarında.`);
        } else {
          resolve('Henüz kaydedilmiş sağlık harcamanız bulunmuyor. Yeni bir sağlık harcaması eklemek için "Harcamalar" sayfasına gidebilirsiniz.');
        }
        return;
      }
      
      // Market harcamaları sorguları
      if (lowercaseMessage.includes('market') && lowercaseMessage.includes('harcama')) {
        const marketExpenses = categoryExpenses['Market'] || [];
        const totalMarketExpenses = categoryTotals['Market'] || 0;
        
        if (marketExpenses.length > 0) {
          const budgetInfo = financialSummary.budgetStatus["Market"];
          const percentUsed = Math.round((budgetInfo.used / budgetInfo.limit) * 100);
          const budgetStatus = percentUsed > 90 ? "kritik seviyede" : percentUsed > 75 ? "yüksek seviyede" : "iyi durumda";
          
          const lastExpenseDate = new Date(marketExpenses[marketExpenses.length-1]?.date || new Date()).toLocaleDateString('tr-TR');
          const lastExpenseAmount = marketExpenses[marketExpenses.length-1]?.amount?.toLocaleString('tr-TR') || 0;
          
          resolve(`Bu ay toplam ${totalMarketExpenses.toLocaleString('tr-TR')} ₺ market harcaması yapmışsınız. Bu, aylık bütçenizin %${percentUsed}'ini kullandığınız anlamına geliyor ve ${budgetStatus}. Son market harcamanız ${lastExpenseDate} tarihinde ${lastExpenseAmount} ₺ tutarında. Bu kategoride ay sonuna kadar ${budgetInfo.remaining.toLocaleString('tr-TR')} ₺ harcama hakkınız bulunuyor.`);
        } else {
          resolve('Henüz kaydedilmiş market harcamanız bulunmuyor. Yeni bir market harcaması eklemek için "Harcamalar" sayfasına gidebilirsiniz.');
        }
        return;
      }
      
      // Yatırım bilgileri sorguları
      if (lowercaseMessage.includes('yatırım') || 
          (lowercaseMessage.includes('portföy') && !lowercaseMessage.includes('harcama'))) {
        
        let allocationText = '';
        Object.entries(financialSummary.investments.allocation).forEach(([asset, percentage]) => {
          allocationText += `${asset}: %${percentage}, `;
        });
        
        allocationText = allocationText.slice(0, -2); // Son virgül ve boşluğu kaldır
        
        resolve(`Toplam yatırım portföyünüz ${financialSummary.investments.total.toLocaleString('tr-TR')} ₺ değerindedir. Son bir ayda %${financialSummary.investments.monthlyReturn} ve son bir yılda %${financialSummary.investments.yearlyReturn} getiri elde ettiniz. Portföy dağılımınız: ${allocationText}. Yatırımlarınızı "Yatırımlar" sayfasından detaylı olarak görüntüleyebilir ve yönetebilirsiniz.`);
        return;
      }
      
      // Finansal hedefler sorguları
      if ((lowercaseMessage.includes('hedef') || lowercaseMessage.includes('amaç')) && 
          !lowercaseMessage.includes('harcama')) {
        
        let goalsText = '';
        financialSummary.goals.forEach(goal => {
          goalsText += `${goal.name}: ${goal.current.toLocaleString('tr-TR')} ₺ / ${goal.target.toLocaleString('tr-TR')} ₺ (%${Math.round(goal.progress)}), `;
        });
        
        goalsText = goalsText.slice(0, -2); // Son virgül ve boşluğu kaldır
        
        resolve(`Finansal hedeflerinizin durumu:\n${goalsText}\n\nHedeflerinizi "Hedefler" sayfasından detaylı olarak görüntüleyebilir ve düzenleyebilirsiniz.`);
        return;
      }
      
      // Harcama kategorileri analizi
      if (lowercaseMessage.includes('kategori') && 
          (lowercaseMessage.includes('analiz') || lowercaseMessage.includes('dağılım'))) {
        
        if (Object.keys(categoryTotals).length > 0) {
          let categoryAnalysisText = '';
          let totalAmount = 0;
          
          Object.entries(categoryTotals).forEach(([category, amount]) => {
            totalAmount += amount;
          });
          
          Object.entries(categoryTotals).forEach(([category, amount]) => {
            const percentage = Math.round((amount / totalAmount) * 100);
            categoryAnalysisText += `${category}: ${amount.toLocaleString('tr-TR')} ₺ (%${percentage}), `;
          });
          
          categoryAnalysisText = categoryAnalysisText.slice(0, -2); // Son virgül ve boşluğu kaldır
          
          resolve(`Harcamalarınızın kategorilere göre dağılımı:\n${categoryAnalysisText}\n\nHarcama analizlerinizi "Dashboard" sayfasında görsel olarak inceleyebilirsiniz.`);
        } else {
          resolve('Henüz kaydedilmiş kategorili harcamanız bulunmuyor. Harcama eklemek için "Harcamalar" sayfasına gidebilirsiniz.');
        }
        return;
      }
      
      // Gelir-gider dengesi sorguları
      if (lowercaseMessage.includes('gelir') && lowercaseMessage.includes('gider') && 
          (lowercaseMessage.includes('denge') || lowercaseMessage.includes('fark') || lowercaseMessage.includes('karşılaştır'))) {
        
        const difference = financialSummary.monthlyIncome - financialSummary.monthlyExpenses;
        const differencePercentage = Math.round((difference / financialSummary.monthlyIncome) * 100);
        
        resolve(`${financialSummary.currentMonth} ayında ${financialSummary.monthlyIncome.toLocaleString('tr-TR')} ₺ gelir elde ettiniz ve ${financialSummary.monthlyExpenses.toLocaleString('tr-TR')} ₺ harcama yaptınız. Gelir-gider farkınız ${difference.toLocaleString('tr-TR')} ₺ olup, bu gelirinizin %${differencePercentage}'sini oluşturuyor. ${difference > 0 ? 'Pozitif bir nakit akışınız var.' : 'Negatif bir nakit akışınız var, harcamalarınızı azaltmanız önerilir.'}`);
        return;
      }
      
      // Eğitim harcamaları sorguları
      if (lowercaseMessage.includes('eğitim') && lowercaseMessage.includes('harcama')) {
        const educationExpenses = categoryExpenses['Eğitim'] || [];
        const totalEducationExpenses = categoryTotals['Eğitim'] || 0;
        
        if (educationExpenses.length > 0) {
          const taxDeductibleEdu = educationExpenses.filter(exp => exp.is_tax_deductible);
          const taxDeductibleEduTotal = taxDeductibleEdu.reduce((total, exp) => total + exp.amount, 0);
          
          const lastExpenseDate = new Date(educationExpenses[educationExpenses.length-1]?.date || new Date()).toLocaleDateString('tr-TR');
          const lastExpenseAmount = educationExpenses[educationExpenses.length-1]?.amount?.toLocaleString('tr-TR') || 0;
          
          resolve(`Bu yıl toplam ${totalEducationExpenses.toLocaleString('tr-TR')} ₺ eğitim harcaması yapmışsınız. Bunların ${taxDeductibleEduTotal.toLocaleString('tr-TR')} ₺ tutarındaki kısmı vergi indirimine tabi. Son eğitim harcamanız ${lastExpenseDate} tarihinde ${lastExpenseAmount} ₺ tutarında.`);
        } else {
          resolve('Henüz kaydedilmiş eğitim harcamanız bulunmuyor. Yeni bir eğitim harcaması eklemek için "Harcamalar" sayfasına gidebilirsiniz.');
        }
        return;
      }
      
      // Fatura harcamaları sorguları
      if (lowercaseMessage.includes('fatura') && lowercaseMessage.includes('harcama')) {
        const billExpenses = categoryExpenses['Faturalar'] || [];
        const totalBillExpenses = categoryTotals['Faturalar'] || 0;
        
        if (billExpenses.length > 0) {
          const budgetInfo = financialSummary.budgetStatus["Faturalar"];
          const percentUsed = Math.round((budgetInfo.used / budgetInfo.limit) * 100);
          
          const lastExpenseDate = new Date(billExpenses[billExpenses.length-1]?.date || new Date()).toLocaleDateString('tr-TR');
          const lastExpenseAmount = billExpenses[billExpenses.length-1]?.amount?.toLocaleString('tr-TR') || 0;
          
          resolve(`Bu ay toplam ${totalBillExpenses.toLocaleString('tr-TR')} ₺ fatura ödemesi yapmışsınız. Bu, aylık bütçenizin %${percentUsed}'ini kullandığınız anlamına geliyor. Son fatura ödemeniz ${lastExpenseDate} tarihinde ${lastExpenseAmount} ₺ tutarında. Bu kategoride ay sonuna kadar ${budgetInfo.remaining.toLocaleString('tr-TR')} ₺ harcama hakkınız bulunuyor.`);
        } else {
          resolve('Henüz kaydedilmiş fatura ödemeniz bulunmuyor. Yeni bir fatura ödemesi eklemek için "Harcamalar" sayfasına gidebilirsiniz.');
        }
        return;
      }
      
      // Ulaşım harcamaları sorguları
      if (lowercaseMessage.includes('ulaşım') && lowercaseMessage.includes('harcama')) {
        const transportExpenses = categoryExpenses['Ulaşım'] || [];
        const totalTransportExpenses = categoryTotals['Ulaşım'] || 0;
        
        if (transportExpenses.length > 0) {
          const budgetInfo = financialSummary.budgetStatus["Ulaşım"];
          const percentUsed = Math.round((budgetInfo.used / budgetInfo.limit) * 100);
          
          const lastExpenseDate = new Date(transportExpenses[transportExpenses.length-1]?.date || new Date()).toLocaleDateString('tr-TR');
          const lastExpenseAmount = transportExpenses[transportExpenses.length-1]?.amount?.toLocaleString('tr-TR') || 0;
          
          resolve(`Bu ay toplam ${totalTransportExpenses.toLocaleString('tr-TR')} ₺ ulaşım harcaması yapmışsınız. Bu, aylık bütçenizin %${percentUsed}'ini kullandığınız anlamına geliyor. Son ulaşım harcamanız ${lastExpenseDate} tarihinde ${lastExpenseAmount} ₺ tutarında. Bu kategoride ay sonuna kadar ${budgetInfo.remaining.toLocaleString('tr-TR')} ₺ harcama hakkınız bulunuyor.`);
        } else {
          resolve('Henüz kaydedilmiş ulaşım harcamanız bulunmuyor. Yeni bir ulaşım harcaması eklemek için "Harcamalar" sayfasına gidebilirsiniz.');
        }
        return;
      }
      
      // Toplam harcama sorguları
      if (lowercaseMessage.includes('toplam') && lowercaseMessage.includes('harcama')) {
        if (expenses.length > 0) {
          // En çok harcama yapılan kategoriyi bul
          let maxCategory = '';
          let maxAmount = 0;
          
          Object.entries(categoryTotals).forEach(([category, amount]) => {
            if (amount > maxAmount) {
              maxCategory = category;
              maxAmount = amount;
            }
          });
          
          resolve(`Bu ay toplam ${financialSummary.monthlyExpenses.toLocaleString('tr-TR')} ₺ harcama yapmışsınız. En çok harcama yaptığınız kategori, ${maxAmount.toLocaleString('tr-TR')} ₺ ile "${maxCategory}" kategorisidir. Vergi indirimine tabi toplam harcamanız: ${totalTaxDeductible.toLocaleString('tr-TR')} ₺.`);
        } else {
          resolve('Henüz kaydedilmiş harcamanız bulunmuyor. Harcamalarınızı takip etmek için "Harcamalar" sayfasına gidebilirsiniz.');
        }
        return;
      }
      
      // Vergi indirimleri hakkında bilgi sor
      if (lowercaseMessage.includes('vergi') && lowercaseMessage.includes('indirim')) {
        if (taxDeductibleExpenses.length > 0) {
          // Kategori bazında vergi indirimleri
          const taxDeductibleByCategory = {};
          taxDeductibleExpenses.forEach(exp => {
            if (taxDeductibleByCategory[exp.category]) {
              taxDeductibleByCategory[exp.category] += exp.amount;
            } else {
              taxDeductibleByCategory[exp.category] = exp.amount;
            }
          });
          
          let taxBreakdownText = '';
          Object.entries(taxDeductibleByCategory).forEach(([category, amount]) => {
            taxBreakdownText += `${category}: ${amount.toLocaleString('tr-TR')} ₺, `;
          });
          
          taxBreakdownText = taxBreakdownText.slice(0, -2); // Son virgül ve boşluğu kaldır
          
          resolve(`Toplam ${totalTaxDeductible.toLocaleString('tr-TR')} ₺ tutarında vergi indirimine tabi harcamanız bulunuyor. Kategori bazında dağılım: ${taxBreakdownText}. Vergi indirimine tabi yeni harcama eklemek için "Harcamalar" sayfasından ilgili harcamayı ekleyip "Vergi İndirimi" alanını "Evet" olarak işaretleyebilirsiniz.`);
        } else {
          resolve('Henüz vergi indirimine tabi harcamanız bulunmuyor. Vergi avantajı sağlayan harcamalarınızı (eğitim, sağlık, bağış gibi) eklemek ve "Vergi İndirimi" olarak işaretlemek için "Harcamalar" sayfasını kullanabilirsiniz.');
        }
        return;
      }
      
      // Tavsiye sorguları
      if (lowercaseMessage.includes('tavsiye') || lowercaseMessage.includes('öneri')) {
        const savingsRate = financialSummary.savingsRate;
        
        if (savingsRate < 10) {
          resolve('Finansal durumunuzu iyileştirmek için harcamalarınızı azaltmanızı ve tasarruf oranınızı artırmanızı öneririm. Öncelikle market ve eğlence gibi kategorilerdeki harcamalarınızı gözden geçirin. Acil durum fonunuz için aylık gelirinizin en az %10\'unu ayırmaya çalışın.');
        } else if (savingsRate < 20) {
          resolve('Finansal durumunuz orta seviyede. Tasarruf oranınızı artırmak için gereksiz aboneliklerinizi gözden geçirin ve düzenli olarak fiyat karşılaştırması yapın. Bütçenizi daha etkin yönetmek için "Bütçe" sayfasındaki analiz araçlarını kullanabilirsiniz.');
        } else {
          resolve('Finansal durumunuz iyi görünüyor. Tasarruflarınızı çeşitli yatırım araçlarında değerlendirerek paranızın değerini koruyabilirsiniz. Emeklilik planınızı gözden geçirin ve uzun vadeli finansal hedeflerinize odaklanın. "Yatırımlar" sayfasında size uygun yatırım araçları sunulmaktadır.');
        }
        return;
      }
      
      // Masraf kategorisi sorguları
      if (lowercaseMessage.includes('kategori') && (lowercaseMessage.includes('ne') || lowercaseMessage.includes('nedir') || lowercaseMessage.includes('hangi'))) {
        if (Object.keys(categoryTotals).length > 0) {
          const categories = Object.keys(categoryTotals).join(', ');
          resolve(`Harcama kategorileriniz: ${categories}. Bu kategorilerin herhangi biri hakkında daha detaylı bilgi almak için "Market harcamalarım ne kadar?" gibi sorular sorabilirsiniz.`);
        } else {
          resolve('Henüz kaydedilmiş kategorili harcamanız bulunmuyor. Harcama eklemek için "Harcamalar" sayfasına gidebilirsiniz.');
        }
        return;
      }
      
      // Temel cevaplar
      if (lowercaseMessage.includes('merhaba') || lowercaseMessage.includes('selam')) {
        resolve('Merhaba! Fintech AI asistanınız olarak size nasıl yardımcı olabilirim? Finansal verileriniz, harcamalarınız, gelirleriniz, tasarruflarınız veya yatırımlarınız hakkında sorular sorabilirsiniz.');
      } else if (lowercaseMessage.includes('harcama') || lowercaseMessage.includes('gider')) {
        // En çok harcama yapılan kategoriyi bul
        let maxCategory = '';
        let maxAmount = 0;
        
        Object.entries(categoryTotals).forEach(([category, amount]) => {
          if (amount > maxAmount) {
            maxCategory = category;
            maxAmount = amount;
          }
        });
        
        resolve(`Harcamalarınızı "Harcamalar" sayfasından görüntüleyebilir, ekleyebilir ve düzenleyebilirsiniz. En yüksek harcama kategoriniz "${maxCategory}" olarak görünüyor. Belirli bir kategori hakkında daha fazla bilgi için "Sağlık harcamalarım ne kadar?" gibi sorular sorabilirsiniz.`);
      } else if (lowercaseMessage.includes('gelir') || lowercaseMessage.includes('kazanç')) {
        resolve(`Gelirinizi "Gelirler" sayfasından yönetebilirsiniz. ${financialSummary.currentMonth} ayı geliriniz ${financialSummary.monthlyIncome.toLocaleString('tr-TR')} ₺, bu ${financialSummary.previousMonth} ayına göre %${financialSummary.incomeGrowth} artış gösteriyor.`);
      } else if (lowercaseMessage.includes('bütçe') || lowercaseMessage.includes('plan')) {
        resolve('Bütçe planlama özelliğimizle aylık harcama limitlerini belirleyebilirsiniz. Şu ana kadar market harcamalarınız için belirlediğiniz limitin %80\'ine ulaştınız. Detaylı bütçe bilgisi için "Bütçe durumum nedir?" diye sorabilirsiniz.');
      } else if (lowercaseMessage.includes('yatırım') || lowercaseMessage.includes('borsa')) {
        resolve(`Yatırım portföyünüzü "Yatırımlar" sayfasında takip edebilirsiniz. Portföyünüz son bir ayda %${financialSummary.investments.monthlyReturn} değer kazandı. Detaylı bilgi için "Yatırım portföyüm nedir?" diye sorabilirsiniz.`);
      } else if (lowercaseMessage.includes('teşekkür')) {
        resolve('Rica ederim! Başka bir konuda yardıma ihtiyacınız olursa, bana sormaktan çekinmeyin.');
      } else if (lowercaseMessage.includes('nasıl')) {
        resolve('Size yardımcı olmak için buradayım. Finansal durumunuz hakkında bilgi almak için "Finansal durumum nasıl?", "Aylık gelir-giderim ne kadar?", "Sağlık harcamalarım ne kadar?" gibi sorular sorabilir veya "Yatırım tavsiyesi" gibi öneriler isteyebilirsiniz.');
      } else if (lowercaseMessage.includes('sayfasına git') || lowercaseMessage.includes('sayfaya git')) {
        resolve('Hangi sayfaya gitmek istediğinizi söyleyebilirsiniz. Örneğin: "Harcamalar sayfasına git" veya "Dashboard\'a git" diyebilirsiniz.');
      } else {
        resolve('Üzgünüm, tam olarak anlayamadım. Finansal verileriniz, harcamalarınız, gelirleriniz, yatırımlarınız veya bütçeniz hakkında daha spesifik sorular sorabilirsiniz. Örneğin "Aylık gelirim ne kadar?", "Sağlık harcamalarım ne kadar?", "Finansal durumumu analiz et" veya "Yatırım tavsiyesi ver" gibi.');
      }
    }, 500);
  });
};

// Mesaj balonu stilleri
const MessageBubble = styled(Paper)(({ theme, sender }) => ({
  padding: theme.spacing(1.5),
  maxWidth: '85%',
  borderRadius: sender === 'user' 
    ? '18px 18px 4px 18px' 
    : '18px 18px 18px 4px',
  backgroundColor: sender === 'user' 
    ? theme.palette.primary.main 
    : theme.palette.mode === 'dark' 
      ? theme.palette.grey[800] 
      : theme.palette.grey[100],
  color: sender === 'user' 
    ? theme.palette.primary.contrastText 
    : theme.palette.text.primary,
  wordBreak: 'break-word',
  '& .MuiTypography-root': {
    color: 'inherit'
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    borderRadius: sender === 'user' 
      ? '15px 15px 4px 15px' 
      : '15px 15px 15px 4px',
  }
}));

const ChatBot = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: 'Merhaba! Fintech AI asistanınız olarak size nasıl yardımcı olabilirim? Harcamalarınız, gelirleriniz veya finansal durumunuz hakkında sorular sorabilirsiniz.', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Mesajları otomatik kaydırma
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sohbet açıldığında input alanına odaklan
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300);
    }
  }, [open]);

  // Sayfaya yönlendirme işlemi
  const handleNavigation = (path) => {
    navigate(path);
    // Mobil görünümde sohbeti kapat
    if (isMobile) {
      setOpen(false);
    }
  };

  // Enter tuşuyla mesaj gönderme
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Kullanıcı mesajını gönderme
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Kullanıcı mesajını ekle
    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Navigasyon komutlarını kontrol et
    const lowercaseInput = input.toLowerCase();
    if (lowercaseInput.includes('dashboard') || lowercaseInput.includes('anasayfa')) {
      handleNavigation('/');
      setLoading(false);
      return;
    } else if (lowercaseInput.includes('harcama sayfası') || lowercaseInput.includes('harcamalar sayfası')) {
      handleNavigation('/expenses');
      
      // Navigasyon mesajını ekle
      const botMessage = { id: Date.now() + 1, text: 'Sizi Harcamalar sayfasına yönlendiriyorum.', sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
      return;
    } else if (lowercaseInput.includes('gelir sayfası') || lowercaseInput.includes('gelirler sayfası')) {
      handleNavigation('/income');
      
      // Navigasyon mesajını ekle
      const botMessage = { id: Date.now() + 1, text: 'Sizi Gelirler sayfasına yönlendiriyorum.', sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
      return;
    } else if (lowercaseInput.includes('vergi planlaması') || lowercaseInput.includes('vergi sayfası')) {
      handleNavigation('/tax-planning');
      
      // Navigasyon mesajını ekle
      const botMessage = { id: Date.now() + 1, text: 'Sizi Vergi Planlaması sayfasına yönlendiriyorum.', sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
      return;
    }

    try {
      // AI cevabını al - artık daha akıllı olan smartAIResponse kullanıyoruz
      const aiResponse = await smartAIResponse(input);
      
      // AI mesajını ekle
      const botMessage = { id: Date.now() + 1, text: aiResponse, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Mesaj gönderilirken hata oluştu:', error);
      // Hata mesajı
      const errorMessage = { 
        id: Date.now() + 1, 
        text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 
        sender: 'bot' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Sohbet açma butonu */}
      <Zoom in={!open}>
        <Fab
          color="primary"
          aria-label="chat"
          onClick={() => setOpen(true)}
          sx={{ 
            position: 'fixed', 
            bottom: { xs: 72, sm: 20 }, // Alt navigasyon için yükseklik ayarı
            right: { xs: 16, sm: 20 },
            zIndex: 1000
          }}
        >
          <SmartToyIcon />
        </Fab>
      </Zoom>

      {/* Sohbet çekmecesi */}
      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { 
            width: { xs: '100%', sm: 400 }, 
            maxWidth: '100%',
            height: { xs: isMobile ? '80%' : '70%', sm: '100%' },
            bottom: 0,
            top: { xs: 'auto', sm: 0 },
            borderTopLeftRadius: { xs: 16, sm: 0 },
            borderTopRightRadius: { xs: 16, sm: 0 }
          }
        }}
        variant="temporary"
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Başlık */}
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: 1,
              borderColor: 'divider'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 1, width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 } }}>
                <SmartToyIcon fontSize={isMobile ? "small" : "medium"} />
              </Avatar>
              <Typography variant={isMobile ? "subtitle1" : "h6"}>Fintech AI Asistan</Typography>
            </Box>
            <IconButton onClick={() => setOpen(false)} size={isMobile ? "small" : "medium"}>
              <CloseIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
          </Box>

          {/* Mesaj listesi */}
          <List sx={{ 
            flexGrow: 1, 
            overflow: 'auto', 
            p: { xs: 1, sm: 2 }, 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            {messages.map(message => (
              <ListItem
                key={message.id}
                sx={{ 
                  alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  p: { xs: 0.3, sm: 0.5 },
                  mb: { xs: 0.5, sm: 0.8 }
                }}
              >
                {message.sender === 'bot' && (
                  <ListItemAvatar sx={{ minWidth: { xs: 32, sm: 40 } }}>
                    <Avatar sx={{ width: { xs: 24, sm: 32 }, height: { xs: 24, sm: 32 }, bgcolor: 'primary.main' }}>
                      <SmartToyIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                )}
                <ListItemText
                  primary={
                    <MessageBubble sender={message.sender}>
                      <Typography variant="body2">{message.text}</Typography>
                    </MessageBubble>
                  }
                  disableTypography
                />
                {message.sender === 'user' && (
                  <ListItemAvatar sx={{ minWidth: { xs: 32, sm: 40 } }}>
                    <Avatar sx={{ width: { xs: 24, sm: 32 }, height: { xs: 24, sm: 32 }, ml: 1, bgcolor: 'grey.400' }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                )}
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
            {loading && (
              <Box sx={{ display: 'flex', p: 1, justifyContent: 'center' }}>
                <CircularProgress size={isMobile ? 20 : 24} />
              </Box>
            )}
          </List>

          {/* Mesaj girişi */}
          <Box
            component="form"
            sx={{
              p: { xs: 1, sm: 2 },
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center'
            }}
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <TextField
              fullWidth
              size={isMobile ? "small" : "medium"}
              placeholder="Bir mesaj yazın..."
              variant="outlined"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              inputRef={inputRef}
              InputProps={{
                sx: { 
                  borderRadius: 4,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }
              }}
            />
            <IconButton 
              color="primary" 
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
              size={isMobile ? "small" : "medium"}
              sx={{ ml: 1 }}
            >
              <SendIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default ChatBot; 