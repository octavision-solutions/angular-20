#!/bin/bash

# Fix import paths for different directory levels
# For files in src/app/theme/layout/admin/ (depth 5)
find src/app/theme/layout/admin -maxdepth 1 -name "*.ts" -exec sed -i '' "s|from 'src/app/|from '../../../|g" {} \;

# For files in src/app/theme/layout/admin/navigation/ (depth 6)
find src/app/theme/layout/admin/navigation -maxdepth 1 -name "*.ts" -exec sed -i '' "s|from 'src/app/|from '../../../../|g" {} \;

# For files in src/app/theme/layout/admin/nav-bar/ (depth 6)
find src/app/theme/layout/admin/nav-bar -maxdepth 1 -name "*.ts" -exec sed -i '' "s|from 'src/app/|from '../../../../|g" {} \;

# For files in src/app/theme/layout/admin/navigation/nav-content/ (depth 7)
find src/app/theme/layout/admin/navigation/nav-content -maxdepth 1 -name "*.ts" -exec sed -i '' "s|from 'src/app/|from '../../../../../|g" {} \;

# For files in src/app/theme/layout/admin/navigation/nav-logo/ (depth 7)
find src/app/theme/layout/admin/navigation/nav-logo -maxdepth 1 -name "*.ts" -exec sed -i '' "s|from 'src/app/|from '../../../../../|g" {} \;

# For files deeper in the hierarchy
find src/app/theme/layout/admin/navigation/nav-content -mindepth 1 -name "*.ts" -exec sed -i '' "s|from 'src/app/|from '../../../../../../|g" {} \;

# For files in src/app/theme/layout/admin/nav-bar subdirectories
find src/app/theme/layout/admin/nav-bar -mindepth 1 -name "*.ts" -exec sed -i '' "s|from 'src/app/|from '../../../../../|g" {} \;

# For files in src/app/theme/shared/
find src/app/theme/shared -name "*.ts" -exec sed -i '' "s|from 'src/app/|from '../../|g" {} \;

# For files in src/app/pages/
find src/app/pages -name "*.ts" -exec sed -i '' "s|from 'src/app/|from '../../|g" {} \;

# Fix environment imports
find src -name "*.ts" -exec sed -i '' "s|from 'src/environments/|from './|g" {} \;
find src -name "*.ts" -exec sed -i '' "s|from 'src/environments/|from '../environments/|g" {} \;