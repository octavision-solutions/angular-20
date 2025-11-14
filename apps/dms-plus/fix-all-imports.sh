#!/bin/bash

echo "Comprehensive fix for DMS Plus import paths and type issues..."

# Fix SharedModule imports to correct relative paths
echo "Fixing SharedModule imports..."

# Fix deep navigation imports first
find src/app/theme/layout/admin/navigation/nav-content -mindepth 1 -name "*.ts" -exec sed -i '' "s|from '../../../../../../shared/shared.module'|from '../../../../../../theme/shared/shared.module'|g" {} \;

find src/app/theme/layout/admin/navigation/nav-content -name "*.ts" -exec sed -i '' "s|from '../../../../../shared/shared.module'|from '../../../../../theme/shared/shared.module'|g" {} \;

find src/app/theme/layout/admin/nav-bar -mindepth 1 -name "*.ts" -exec sed -i '' "s|from '../../../../../shared/shared.module'|from '../../../../../theme/shared/shared.module'|g" {} \;

find src/app/theme/layout/admin/navigation -maxdepth 1 -name "*.ts" -exec sed -i '' "s|from '../../../../shared/shared.module'|from '../../../../theme/shared/shared.module'|g" {} \;

find src/app/theme/layout/admin/nav-bar -maxdepth 1 -name "*.ts" -exec sed -i '' "s|from '../../../../shared/shared.module'|from '../../../../theme/shared/shared.module'|g" {} \;

# Fix environment imports
echo "Fixing environment imports..."
find src -name "*.ts" -exec sed -i '' "s|from './environment'|from '../../../../../environments/environment'|g" {} \;

# Fix database service imports  
echo "Fixing database service imports..."
find src -name "*.ts" -exec sed -i '' "s|from 'src/app/../core/services/database.service'|from '../../../core/services/database.service'|g" {} \;

# Fix auth service imports
echo "Fixing auth service imports..."
find src -name "*.ts" -exec sed -i '' "s|from '../../../../core/services/auth.service'|from '../../../../../core/services/auth.service'|g" {} \;

echo "Comprehensive fixes completed."