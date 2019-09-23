import React from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import { Title } from 'react-admin';

const SystemEditor = () => (
  <Card>
    <Title title="System" />
    <CardContent>
      <p>WIP -- we should put first-time setup here.</p>
      <p>Use the menu on the left to navigate to other stuff.</p>
    </CardContent>
  </Card>
);

export { SystemEditor };
