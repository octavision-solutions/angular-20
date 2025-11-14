#!/bin/bash

echo "Fixing SharedModule imports..."

# For files in theme/layout/admin/navigation/nav-content subdirectories (depth 8)
find src/app/theme/layout/admin/navigation/nav-content -mindepth 1 -name "*.ts" -exec sed -i '' "s|from '../../../../../../theme/shared/shared.module'|from '../../../../../../shared/shared.module'|g" {} \;

# For files in theme/layout/admin/navigation/nav-logo (depth 7) 
find src/app/theme/layout/admin/navigation/nav-logo -name "*.ts" -exec sed -i '' "s|from '../../../../../theme/shared/shared.module'|from '../../../../../shared/shared.module'|g" {} \;

# For files in theme/layout/admin/navigation/nav-content (depth 7)
find src/app/theme/layout/admin/navigation/nav-content -maxdepth 1 -name "*.ts" -exec sed -i '' "s|from '../../../../../theme/shared/shared.module'|from '../../../../../shared/shared.module'|g" {} \;

# For files in theme/layout/admin/nav-bar subdirectories (depth 6-7)
find src/app/theme/layout/admin/nav-bar -mindepth 1 -name "*.ts" -exec sed -i '' "s|from '../../../../../theme/shared/shared.module'|from '../../../../../shared/shared.module'|g" {} \;

# For files in theme/layout/admin/navigation (depth 6)
find src/app/theme/layout/admin/navigation -maxdepth 1 -name "*.ts" -exec sed -i '' "s|from '../../../../theme/shared/shared.module'|from '../../../../shared/shared.module'|g" {} \;

# For files in theme/layout/admin/nav-bar (depth 6)
find src/app/theme/layout/admin/nav-bar -maxdepth 1 -name "*.ts" -exec sed -i '' "s|from '../../../../theme/shared/shared.module'|from '../../../../shared/shared.module'|g" {} \;

# For files in pages subdirectories (depth varies)
find src/app/pages -name "*.ts" -exec sed -i '' "s|from '../../theme/shared/shared.module'|from '../../theme/shared/shared.module'|g" {} \;
find src/app/pages -name "*.ts" -exec sed -i '' "s|from '../../../theme/shared/shared.module'|from '../../../theme/shared/shared.module'|g" {} \;

echo "SharedModule import fixes completed."