#!/bin/bash
find client/src/pages/tabs -type f -name "*.tsx" -exec sed -i '' 's/Real-time Map Intelligence/Разведка по карте в реальном времени/g' {} +
find client/src/pages/tabs -type f -name "*.tsx" -exec sed -i '' 's/Regional Analysis/Региональный анализ/g' {} +
find client/src/pages/tabs -type f -name "*.tsx" -exec sed -i '' 's/Data Explorer/Обозреватель данных/g' {} +
find client/src/pages/tabs -type f -name "*.tsx" -exec sed -i '' 's/News Feed/Новостная лента/g' {} +
find client/src/pages/tabs -type f -name "*.tsx" -exec sed -i '' 's/Network Graph/Сетевой граф/g' {} +
find client/src/pages/tabs -type f -name "*.tsx" -exec sed -i '' 's/Source Management/Управление источниками/g' {} +
find client/src/pages/tabs -type f -name "*.tsx" -exec sed -i '' 's/Data Provenance/Проверка подлинности данных/g' {} +
find client/src/pages/tabs -type f -name "*.tsx" -exec sed -i '' 's/Facility Intelligence Registry/Реестр разведывательных объектов/g' {} +
find client/src/pages/tabs -type f -name "*.tsx" -exec sed -i '' 's/Threat Level/Уровень угрозы/g' {} +
find client/src/pages/tabs -type f -name "*.tsx" -exec sed -i '' 's/Sources/Источники/g' {} +
find client/src/pages/tabs -type f -name "*.tsx" -exec sed -i '' 's/Articles/Статьи/g' {} +
find client/src/pages/tabs -type f -name "*.tsx" -exec sed -i '' 's/Loading/Загрузка/g' {} +
find client/src/pages/tabs -type f -name "*.tsx" -exec sed -i '' 's/Error/Ошибка/g' {} +
