// Angular modules
import { NgIf }                 from '@angular/common';
import { Component }            from '@angular/core';
import { OnInit }               from '@angular/core';

// Services
import { StoreService }         from '@services/store.service';

// Components
import { ProgressBarComponent } from '@blocks/progress-bar/progress-bar.component';
import { PageLayoutComponent }  from '@layouts/page-layout/page-layout.component';

@Component({
  selector    : 'app-chart',
  templateUrl : './chart.component.html',
  styleUrls   : ['./chart.component.scss'],
  standalone  : true,
  imports     : [PageLayoutComponent, NgIf, ProgressBarComponent]
})
export class ChartComponent implements OnInit
{
  constructor
  (
    public storeService : StoreService
  )
  { }

  // -------------------------------------------------------------------------------
  // NOTE Init ---------------------------------------------------------------------
  // -------------------------------------------------------------------------------

  public ngOnInit() : void
  {
    setTimeout(_ =>
    {
      this.storeService.isLoading.set(false);
    }, 2000);
  }

  // -------------------------------------------------------------------------------
  // NOTE Actions ------------------------------------------------------------------
  // -------------------------------------------------------------------------------

  // -------------------------------------------------------------------------------
  // NOTE Computed props -----------------------------------------------------------
  // -------------------------------------------------------------------------------

  // -------------------------------------------------------------------------------
  // NOTE Helpers ------------------------------------------------------------------
  // -------------------------------------------------------------------------------

  // -------------------------------------------------------------------------------
  // NOTE Requests -----------------------------------------------------------------
  // -------------------------------------------------------------------------------

  // -------------------------------------------------------------------------------
  // NOTE Subscriptions ------------------------------------------------------------
  // -------------------------------------------------------------------------------

}
