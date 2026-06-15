#!/bin/bash
find client/src/pages -type f -name "*.tsx" -exec sed -i '' 's/NEWS & GEO INTELLIGENCE/НОВОСТИ И ГЕОРАЗВЕДКА/g' {} +
find client/src/pages -type f -name "*.tsx" -exec sed -i '' 's/OPEN INTELLIGENCE/ОТКРЫТАЯ РАЗВЕДКА/g' {} +
find client/src/pages -type f -name "*.tsx" -exec sed -i '' 's/CLASSIFICATION:/КЛАССИФИКАЦИЯ:/g' {} +
find client/src/pages -type f -name "*.tsx" -exec sed -i '' 's/UNCLASSIFIED \/\/ FOUO/НЕ СЕКРЕТНО \/\/ ДСП/g' {} +
find client/src/pages -type f -name "*.tsx" -exec sed -i '' 's/SYSTEM NOMINAL/СИСТЕМА В НОРМЕ/g' {} +
find client/src/pages -type f -name "*.tsx" -exec sed -i '' 's/MISSIONS PENDING/МИССИЙ В ОЖИДАНИИ/g' {} +
find client/src/pages -type f -name "*.tsx" -exec sed -i '' 's/CRAWLER ACTIVE/CRAWLER АКТИВЕН/g' {} +
find client/src/pages -type f -name "*.tsx" -exec sed -i '' 's/ACTIVE/АКТИВНО/g' {} +
